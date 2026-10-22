-- Rollback-only integration tests: no real records, users or notifications remain.
begin;
create function pg_temp.bps_assert(ok boolean,mensaje text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'BPS TEST: %',mensaje; end if; end $$;
create function pg_temp.bps_denegado(sentencia text) returns void language plpgsql as $$
begin begin execute sentencia; exception when others then return; end; raise exception 'BPS TEST: se permitió %',sentencia; end $$;
create function pg_temp.bps_actor(nombre text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub',current_setting('bpsqa.'||nombre),true); perform set_config('request.jwt.claims',json_build_object('sub',current_setting('bpsqa.'||nombre),'role','authenticated')::text,true); end $$;
do $$ declare n text; u uuid; begin
 foreach n in array array['jd','diego','arturo','admin','otro'] loop
  u:=gen_random_uuid();perform set_config('bpsqa.'||n,u::text,true);
  insert into auth.users(id,email,role,aud) values(u,'qa-bps-'||u||'@example.test','authenticated','authenticated');
  insert into public.roles_usuario(user_id,rol) values(u,case when n in ('jd','admin') then 'admin' else 'comercial' end);
  if n in ('jd','diego','arturo') then insert into public.bps_accesos(user_id,nombre,carga,gestion) values(u,n,n='jd',n='diego'); end if;
 end loop;
end $$;
set local role authenticated;
select pg_temp.bps_actor('jd');
do $$ declare d jsonb; begin
 d:=public.bps_ejecutar('tanda_guardar','{"campos":{"nombre":"QA BPS reversible","fecha":"2026-10-22","criterios":"Prueba"}}');perform set_config('bpsqa.tanda',d->>'id',true);
 d:=public.bps_ejecutar('oportunidad_guardar',jsonb_build_object('campos',jsonb_build_object('corrida_id',d->>'id','nombre','QA Oportunidad','fit','A','multiplicador',2,'pais','Colombia','ingresos',50)));
 perform set_config('bpsqa.oportunidad',d->>'id',true);
 perform pg_temp.bps_assert(d->>'estado'='nueva' and (d->>'prioridad')::int=4 and d->>'moneda'='MXN','Creación, prioridad, país libre y MXN');
 perform pg_temp.bps_assert(exists(select 1 from public.bps_accesos where user_id=(d->>'responsable_id')::uuid and activo and gestion),'Responsable con gestión asignado por servidor');
end $$;
select pg_temp.bps_denegado($q$select public.bps_ejecutar('oportunidad_guardar',jsonb_build_object('id',current_setting('bpsqa.oportunidad'),'revision',1,'campos','{"estado":"en_contacto"}'::jsonb))$q$);
select pg_temp.bps_denegado($q$select public.bps_ejecutar('estado',jsonb_build_object('id',current_setting('bpsqa.oportunidad'),'revision',1,'estado','validada'))$q$);
select pg_temp.bps_denegado($q$update public.bps_oportunidades set estado='validada'$q$);
select pg_temp.bps_denegado($q$insert into public.bps_actividad(evento,autor_nombre) values('falso','Falso')$q$);
select pg_temp.bps_actor('diego');
select pg_temp.bps_denegado($q$select public.bps_ejecutar('tanda_guardar','{"campos":{"nombre":"No"}}')$q$);
select pg_temp.bps_denegado($q$select public.bps_ejecutar('oportunidad_guardar',jsonb_build_object('id',current_setting('bpsqa.oportunidad'),'revision',1,'campos','{"nombre":"No"}'::jsonb))$q$);
select pg_temp.bps_denegado($q$select public.bps_ejecutar('estado',jsonb_build_object('id',current_setting('bpsqa.oportunidad'),'revision',1,'estado','en_contacto'))$q$);
do $$ declare d jsonb; f text; m numeric; esperado int; rev int:=1; begin
 foreach f in array array['A','B','C'] loop
  foreach m in array array[1::numeric,1.5,2] loop
   d:=public.bps_ejecutar('oportunidad_guardar',jsonb_build_object('id',current_setting('bpsqa.oportunidad'),'revision',rev,'campos',jsonb_build_object('fit',f,'multiplicador',m)));
   rev:=(d->>'revision')::int;
   esperado:=case when f='A' and m=2 then 4 when (f='A' and m=1.5)or(f='B' and m=2)then 3 when(f='A'and m=1)or(f='B'and m=1.5)then 2 else 1 end;
   perform pg_temp.bps_assert((d->>'prioridad')::int=esperado,'Matriz de prioridades servidor');
  end loop;
 end loop;
 d:=public.bps_ejecutar('estado',jsonb_build_object('id',current_setting('bpsqa.oportunidad'),'revision',rev,'estado','validada'));
 rev:=(d->>'revision')::int;
 d:=public.bps_ejecutar('estado',jsonb_build_object('id',current_setting('bpsqa.oportunidad'),'revision',rev,'estado','en_contacto'));
 rev:=(d->>'revision')::int;
 perform pg_temp.bps_denegado(format('select public.bps_ejecutar(''estado'',%L::jsonb)',jsonb_build_object('id',d->>'id','revision',rev,'estado','descartada')));
 d:=public.bps_ejecutar('estado',jsonb_build_object('id',d->>'id','revision',rev,'estado','descartada','motivo','No encaja'));
 rev:=(d->>'revision')::int;
 perform pg_temp.bps_denegado(format('select public.bps_ejecutar(''estado'',%L::jsonb)',jsonb_build_object('id',d->>'id','revision',rev,'estado','nueva')));
 d:=public.bps_ejecutar('estado',jsonb_build_object('id',d->>'id','revision',rev,'estado','nueva','motivo','Nueva señal'));
 perform pg_temp.bps_assert(d->>'estado'='nueva','Reabrir conservando historial');
 perform set_config('bpsqa.revision',d->>'revision',true);
 perform pg_temp.bps_denegado(format('select public.bps_ejecutar(''oportunidad_guardar'',%L::jsonb)',jsonb_build_object('id',d->>'id','revision',1,'campos',jsonb_build_object('fit','A'))));
end $$;
select pg_temp.bps_actor('arturo');
select public.bps_ejecutar('comentar',jsonb_build_object('id',current_setting('bpsqa.oportunidad'),'texto','Observación de consulta'));
select pg_temp.bps_assert(exists(select 1 from public.bps_comentarios where oportunidad_id=current_setting('bpsqa.oportunidad')::bigint and autor=auth.uid() and autor_nombre='arturo'),'Comentario con autor real');
select pg_temp.bps_denegado($q$select public.bps_ejecutar('oportunidad_guardar',jsonb_build_object('id',current_setting('bpsqa.oportunidad'),'revision',current_setting('bpsqa.revision'),'campos','{}'::jsonb))$q$);
select pg_temp.bps_denegado($q$select public.bps_ejecutar('comentar',jsonb_build_object('id',current_setting('bpsqa.oportunidad'),'texto','Falso','autor',current_setting('bpsqa.jd')))$q$);
select pg_temp.bps_denegado($q$update public.bps_comentarios set texto='Reescrito'$q$);
select pg_temp.bps_denegado($q$delete from public.bps_oportunidades$q$);
select pg_temp.bps_actor('admin');
select pg_temp.bps_assert((select count(*)=0 from public.bps_oportunidades),'Admin sin membresía no ve contenido');
select pg_temp.bps_denegado($q$select public.bps_ejecutar('comentar',jsonb_build_object('id',current_setting('bpsqa.oportunidad'),'texto','No'))$q$);
select public.bps_ejecutar('acceso_quitar',jsonb_build_object('user_id',current_setting('bpsqa.arturo')));
select pg_temp.bps_actor('arturo');
select pg_temp.bps_assert((select count(*)=0 from public.bps_oportunidades),'Revocación inmediata en lecturas');
select pg_temp.bps_denegado($q$select public.bps_ejecutar('comentar',jsonb_build_object('id',current_setting('bpsqa.oportunidad'),'texto','No'))$q$);
select pg_temp.bps_actor('otro');
select pg_temp.bps_assert((select count(*)=0 from public.bps_corridas),'No miembro no ve tandas');
select pg_temp.bps_assert((select count(*)=0 from public.bps_actividad),'No miembro no ve historial');
select pg_temp.bps_denegado($q$select public.bps_ejecutar('acceso_guardar',jsonb_build_object('user_id',current_setting('bpsqa.otro'),'nombre','No'))$q$);
reset role;
set local role anon;
select pg_temp.bps_denegado($q$select * from public.bps_oportunidades$q$);
select pg_temp.bps_denegado($q$select public.bps_ejecutar('comentar','{}')$q$);
reset role;
rollback;
