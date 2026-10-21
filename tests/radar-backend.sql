-- Transactional integration suite. All test users, files, events and alerts roll
-- back, so no real member receives test notifications or sees test prospects.
begin;
create function pg_temp.comprobar(p_ok boolean,p_mensaje text) returns void language plpgsql as $$
begin if p_ok is distinct from true then raise exception 'PRUEBA: %',p_mensaje; end if; end $$;
create function pg_temp.actor(p_nombre text) returns void language plpgsql as $$
begin
 perform set_config('request.jwt.claim.sub',current_setting('qa.'||p_nombre),true);
 perform set_config('request.jwt.claims',json_build_object('sub',current_setting('qa.'||p_nombre),'role','authenticated')::text,true);
end $$;
do $$ declare v_nombre text; v_id uuid; begin
 foreach v_nombre in array array['jd','jl','jhon','otro'] loop
  v_id:=gen_random_uuid(); perform set_config('qa.'||v_nombre,v_id::text,true);
  insert into auth.users(id,email,role,aud) values(v_id,'qa-radar-'||v_nombre||'-'||v_id||'@example.test','authenticated','authenticated');
  insert into public.roles_usuario(user_id,rol) values(v_id,case when v_nombre='jd' then 'admin' else 'auditor' end);
  if v_nombre<>'otro' then insert into public.radar_accesos(user_id,nombre,pasos)
   values(v_id,'Prueba '||v_nombre,case when v_nombre='jd' then array[1,3,5] when v_nombre='jl' then array[2,4,6,7,10] else array[2,4,10] end); end if;
 end loop;
end $$;
set local role authenticated;
select pg_temp.actor('jd');
do $$ declare v_id bigint; begin
 insert into public.radar_prospectos(empresa,fecha_lista,senal,por_que_ahora,servicios)
 values('QA transaccional Radar',current_date,'Prueba','Prueba','Prueba') returning id into v_id;
 perform set_config('qa.prospecto',v_id::text,true);
end $$;
select pg_temp.actor('jl');
select public.radar_elegir(current_setting('qa.prospecto')::bigint);
select pg_temp.comprobar((select count(*)=10 from public.radar_hitos where prospecto_id=current_setting('qa.prospecto')::bigint),'Elegir genera diez hitos');
select pg_temp.actor('jd');
reset role;
-- Only metadata is needed for SQL validation; no physical file is uploaded.
insert into storage.objects(bucket_id,name,owner_id)
 select 'radar',current_setting('qa.prospecto')||'/3/prueba_'||t||'.pdf',current_setting('qa.jd')
 from unnest(array['matriz_riesgos','guia_entendimiento','ficha_directivos','decision_pack']) t;
set local role authenticated;
insert into public.radar_archivos(prospecto_id,paso,tipo,nombre,ruta,version,subido_por)
 select current_setting('qa.prospecto')::bigint,3,t,t||'.pdf',current_setting('qa.prospecto')||'/3/prueba_'||t||'.pdf',999,current_setting('qa.jd')::uuid
 from unnest(array['matriz_riesgos','guia_entendimiento','ficha_directivos','decision_pack']) t;
select pg_temp.comprobar((select min(version)=1 and max(version)=1 from public.radar_archivos where prospecto_id=current_setting('qa.prospecto')::bigint),'Servidor asigna versiones, no el cliente');
do $$ begin
 begin delete from storage.objects where bucket_id='radar' and name=current_setting('qa.prospecto')||'/3/prueba_matriz_riesgos.pdf'; exception when insufficient_privilege then null; end;
 perform pg_temp.comprobar(exists(select 1 from storage.objects where bucket_id='radar' and name=current_setting('qa.prospecto')||'/3/prueba_matriz_riesgos.pdf'),'Ni admin borra blobs registrados por la API normal');
end $$;
select public.radar_completar_paso(current_setting('qa.prospecto')::bigint,3);
select pg_temp.actor('jl');
update public.radar_prospectos set enfoque_servicio='Prueba',enfoque_angulo='Prueba',enfoque_cuidar='Prueba' where id=current_setting('qa.prospecto')::bigint;
select public.radar_revisar_archivo((select id from public.radar_archivos where prospecto_id=current_setting('qa.prospecto')::bigint and tipo='guia_entendimiento'),'aprobar');
do $$ begin
 begin perform public.radar_completar_paso(current_setting('qa.prospecto')::bigint,4); raise exception 'PRUEBA: paso 4 no se bloqueó';
 exception when others then if sqlerrm like 'PRUEBA:%' then raise; end if; end;
 begin update public.radar_hitos set fecha_real=current_date where prospecto_id=current_setting('qa.prospecto')::bigint and paso=10; raise exception 'PRUEBA: escritura directa de cierre';
 exception when insufficient_privilege then null; end;
 begin insert into public.radar_notificaciones(usuario_id,clave,titulo,texto) values(auth.uid(),'falso','Falso','Falso'); raise exception 'PRUEBA: aviso falsificado';
 exception when insufficient_privilege then null; end;
end $$;
do $$ declare v_id bigint; begin
 select id into v_id from public.radar_archivos where prospecto_id=current_setting('qa.prospecto')::bigint and tipo='matriz_riesgos';
 perform set_config('qa.archivo',v_id::text,true);
 perform public.radar_revisar_archivo(v_id,'corregir','Observación de JL');
 begin perform public.radar_revisar_archivo(v_id,'aprobar'); raise exception 'PRUEBA: se aprobó una versión con correcciones';
 exception when others then if sqlerrm like 'PRUEBA:%' then raise; end if; end;
end $$;
select pg_temp.actor('jhon');
select public.radar_revisar_archivo(current_setting('qa.archivo')::bigint,'corregir','Observación de Jhon');
select pg_temp.actor('otro');
select pg_temp.comprobar((select count(*)=0 from public.radar_notificaciones),'No miembro no ve avisos');
select pg_temp.comprobar((select count(*)=0 from public.radar_observaciones),'No miembro no ve comentarios');
do $$ begin
 begin perform public.radar_revisar_archivo(current_setting('qa.archivo')::bigint,'aprobar'); raise exception 'PRUEBA: no miembro pudo aprobar';
 exception when others then if sqlerrm like 'PRUEBA:%' then raise; end if; end;
end $$;
select pg_temp.actor('jd');
do $$ begin
 begin perform public.radar_revisar_archivo(current_setting('qa.archivo')::bigint,'aprobar'); raise exception 'PRUEBA: JD pudo aprobar';
 exception when others then if sqlerrm like 'PRUEBA:%' then raise; end if; end;
end $$;
reset role;
insert into storage.objects(bucket_id,name,owner_id) values('radar',current_setting('qa.prospecto')||'/3/matriz_v2.pdf',current_setting('qa.jd'));
set local role authenticated;
insert into public.radar_archivos(prospecto_id,paso,tipo,nombre,ruta,subido_por)
 values(current_setting('qa.prospecto')::bigint,3,'matriz_riesgos','matriz_v2.pdf',current_setting('qa.prospecto')||'/3/matriz_v2.pdf',auth.uid());
select pg_temp.comprobar((select max(version)=2 from public.radar_archivos where prospecto_id=current_setting('qa.prospecto')::bigint and tipo='matriz_riesgos'),'v2 permitida con paso 3 cerrado');
select pg_temp.comprobar(exists(select 1 from public.radar_revisiones r join public.radar_archivos a on a.id=r.archivo_id where a.prospecto_id=current_setting('qa.prospecto')::bigint and a.tipo='guia_entendimiento'),'Una nueva versión no invalida aprobaciones de otros documentos');
do $$ declare v_id bigint; begin
 select id into v_id from public.radar_archivos where prospecto_id=current_setting('qa.prospecto')::bigint and tipo='matriz_riesgos' and version=2;
 perform public.radar_revisar_archivo(v_id,'atender','',array(select id from public.radar_observaciones where prospecto_id=current_setting('qa.prospecto')::bigint));
end $$;
select pg_temp.actor('jhon');
do $$ declare v_id bigint; v_obs bigint[]; begin
 select id into v_id from public.radar_archivos where prospecto_id=current_setting('qa.prospecto')::bigint and tipo='matriz_riesgos' and version=2;
 select array_agg(id) into v_obs from public.radar_observaciones where prospecto_id=current_setting('qa.prospecto')::bigint;
 begin perform public.radar_revisar_archivo(v_id,'aprobar'); raise exception 'PRUEBA: aprobación sin resolver observaciones';
 exception when others then if sqlerrm like 'PRUEBA:%' then raise; end if; end;
 begin perform public.radar_revisar_archivo(v_id,'aprobar','',array[v_obs[1]]); raise exception 'PRUEBA: resolución parcial de observaciones';
 exception when others then if sqlerrm like 'PRUEBA:%' then raise; end if; end;
 perform pg_temp.comprobar((select count(*)=2 from public.radar_observaciones where prospecto_id=current_setting('qa.prospecto')::bigint and resuelta_en is null),'La resolución parcial fallida no modifica observaciones');
 perform public.radar_revisar_archivo(v_id,'aprobar','',v_obs);
 begin perform public.radar_revisar_archivo(current_setting('qa.archivo')::bigint,'aprobar'); raise exception 'PRUEBA: aprobación de v1 sustituida';
 exception when others then if sqlerrm like 'PRUEBA:%' then raise; end if; end;
end $$;
select pg_temp.comprobar((select count(*)=2 from public.radar_observaciones where prospecto_id=current_setting('qa.prospecto')::bigint and resuelta_por=auth.uid()),'Un revisor resuelve explícitamente observaciones de ambos');
do $$ declare v_file record; begin
 for v_file in select id from public.radar_archivos where prospecto_id=current_setting('qa.prospecto')::bigint and tipo in('guia_entendimiento','ficha_directivos') loop
  perform public.radar_revisar_archivo(v_file.id,'aprobar');
 end loop;
end $$;
select pg_temp.actor('jl');
select public.radar_revisar_archivo((select id from public.radar_archivos where prospecto_id=current_setting('qa.prospecto')::bigint and tipo='decision_pack'),'aprobar');
select pg_temp.comprobar((select fecha_real is not null from public.radar_hitos where prospecto_id=current_setting('qa.prospecto')::bigint and paso=10),'Cierre automático 3B con cuatro documentos');
select public.radar_completar_paso(current_setting('qa.prospecto')::bigint,4);
select pg_temp.actor('jd');
reset role;
insert into storage.objects(bucket_id,name,owner_id) values('radar',current_setting('qa.prospecto')||'/3/matriz_v3.pdf',current_setting('qa.jd'));
set local role authenticated;
do $$ begin
 begin insert into public.radar_archivos(prospecto_id,paso,tipo,nombre,ruta,subido_por)
 values(current_setting('qa.prospecto')::bigint,3,'matriz_riesgos','matriz_v3.pdf',current_setting('qa.prospecto')||'/3/matriz_v3.pdf',auth.uid()); raise exception 'PRUEBA: sustitución tras cierre';
 exception when others then if sqlerrm like 'PRUEBA:%' then raise; end if; end;
end $$;
select pg_temp.comprobar((select count(*)=0 from public.radar_notificaciones where usuario_id<>auth.uid()),'RLS solo notificaciones propias');
do $$ begin
 begin update public.radar_notificaciones set texto='falso' where usuario_id=auth.uid(); raise exception 'PRUEBA: cambio de contenido de aviso';
 exception when insufficient_privilege then null; end;
end $$;
update public.radar_notificaciones set leida_en=now() where usuario_id=auth.uid();
reset role;
-- Cron works without any user session and deduplicates each user's daily agenda.
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
select radar_privado.agenda(date '2099-01-05');
select radar_privado.agenda(date '2099-01-05');
select pg_temp.comprobar(not exists(select 1 from public.radar_notificaciones where clave='agenda:2099-01-05' group by usuario_id having count(*)>1),'Agenda idempotente');
select pg_temp.comprobar((select count(*)>0 from public.radar_notificaciones where usuario_id=current_setting('qa.jd')::uuid and clave='agenda:2099-01-05'),'Agenda generada sin sesión de navegador');
delete from public.radar_accesos where user_id=current_setting('qa.jhon')::uuid;
set local role authenticated;
select pg_temp.actor('jhon');
select pg_temp.comprobar((select count(*)=0 from public.radar_notificaciones),'Retirada de acceso oculta avisos');
select pg_temp.comprobar((select count(*)=0 from public.radar_archivos),'Retirada de acceso oculta documentos');
reset role;
select 'OK: versiones, revisiones, observaciones, permisos, orden, agenda y aislamiento. Todo se revierte.' as resultado;
rollback;
