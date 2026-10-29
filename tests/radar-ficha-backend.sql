-- Run after migrations. All fixtures roll back; no real prospect is edited.
begin;
create function pg_temp.comprobar(ok boolean, mensaje text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'PRUEBA: %',mensaje; end if; end $$;
create function pg_temp.rechaza(sql text) returns void language plpgsql as $$
begin
 begin execute sql; exception when others then return; end;
 raise exception 'PRUEBA: se aceptó una operación prohibida: %',sql;
end $$;
do $$ declare v_id uuid; v_nombre text; begin
 foreach v_nombre in array array['autor','revisor','ajeno'] loop
  v_id:=gen_random_uuid(); perform set_config('qa.'||v_nombre,v_id::text,true);
  insert into auth.users(id,email,role,aud) values(v_id,'qa-ficha-'||v_id||'@example.test','authenticated','authenticated');
  if v_nombre<>'ajeno' then insert into public.radar_accesos(user_id,nombre,pasos) values(v_id,v_nombre,case when v_nombre='autor' then array[1,3,5] else array[2,4,6,7,10] end); end if;
 end loop;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('qa.autor'),true);
do $$ declare v_id bigint; begin
 insert into public.radar_prospectos(empresa,fecha_lista,que_hace,senal,por_que_ahora,servicio_principal,servicios,contactos,evidencias)
 values('QA ficha','2099-10-30','Vende servicios','Expansión','Posible necesidad','Consultoría','Detalle original',
 '[{"nombre":"Persona","cargo":"CFO","linkedin":"https://example.test/contacto","estado":"por_validar"}]',
 '[{"bloque":"tamano","nombre":"Fuente A: 680; B: 201–500","estado":"estimacion"}]') returning id into v_id;
 perform set_config('qa.ficha',v_id::text,true);
 insert into public.radar_prospectos(empresa,fecha_lista,senal,por_que_ahora,servicios) values('QA ficha antigua','2099-10-30','Texto histórico','Texto con contactos y fuentes','Servicios históricos') returning id into v_id;
 perform set_config('qa.antigua',v_id::text,true);
 insert into public.radar_prospectos(empresa,fecha_lista) values('QA otro de la misma lista','2099-10-30') returning id into v_id;
 perform set_config('qa.otro_candidato',v_id::text,true);
end $$;
update public.radar_prospectos set ciudad='Medellín' where id=current_setting('qa.antigua')::bigint;
select pg_temp.comprobar((select que_hace is null and por_que_ahora='Texto con contactos y fuentes' from public.radar_prospectos where id=current_setting('qa.antigua')::bigint),'Edición gradual conserva texto antiguo');
update public.radar_prospectos set que_hace='Descripción editada', evidencias='[{"bloque":"entendimiento","nombre":"Fuente oficial","estado":"con_fuente","enlace":"https://example.test","fecha_consulta":"2026-10-29"}]' where id=current_setting('qa.ficha')::bigint;
select pg_temp.rechaza('update public.radar_prospectos set linkedin_empresa=''javascript:alert(1)'' where id='||current_setting('qa.ficha'));
select pg_temp.rechaza('update public.radar_prospectos set contactos=''[{"nombre":"Persona","estado":"por_validar","linkedin":"data:text/html,peligro"}]'' where id='||current_setting('qa.ficha'));
select pg_temp.rechaza('update public.radar_prospectos set evidencias=''[{"bloque":"tamano","nombre":"Fuente","estado":"con_fuente"}]'' where id='||current_setting('qa.ficha'));
select pg_temp.rechaza('update public.radar_prospectos set evidencias=''{}'' where id='||current_setting('qa.ficha'));
select set_config('request.jwt.claim.sub',current_setting('qa.revisor'),true);
select pg_temp.rechaza('update public.radar_prospectos set que_hace=''Sin permiso'' where id='||current_setting('qa.ficha'));
-- Step-2 recovery may update the weekly date without editing the introduction.
update public.radar_prospectos set estado='no_elegido' where id=current_setting('qa.antigua')::bigint;
update public.radar_prospectos set estado='candidato',fecha_lista='2099-11-06' where id=current_setting('qa.antigua')::bigint;
select public.radar_elegir(current_setting('qa.ficha')::bigint);
select pg_temp.comprobar((select estado='no_elegido' from public.radar_prospectos where id=current_setting('qa.otro_candidato')::bigint),'Elegir cierra la lista para los demás candidatos');
select pg_temp.rechaza('select public.radar_elegir('||current_setting('qa.otro_candidato')||')');
select pg_temp.comprobar((select count(*)=10 from public.radar_hitos where prospecto_id=current_setting('qa.ficha')::bigint),'Elección conserva diez hitos');
select pg_temp.rechaza('select public.radar_elegir('||current_setting('qa.ficha')||')');
update public.radar_prospectos set enfoque_servicio='Consultoría',enfoque_angulo='Reportes',enfoque_cuidar='Validar alcance' where id=current_setting('qa.ficha')::bigint;
select set_config('request.jwt.claim.sub',current_setting('qa.autor'),true);
select pg_temp.rechaza('update public.radar_prospectos set que_hace=''Editada tras elegir'' where id='||current_setting('qa.ficha'));
select pg_temp.rechaza('update public.radar_prospectos set estado=''candidato'' where id='||current_setting('qa.ficha'));
select pg_temp.rechaza('update public.radar_prospectos set fecha_lista=''2099-11-06'' where id='||current_setting('qa.ficha'));
select pg_temp.comprobar((select que_hace='Descripción editada' and servicios='Detalle original' from public.radar_prospectos where id=current_setting('qa.ficha')::bigint),'Ficha queda intacta tras elegir');
select set_config('request.jwt.claim.sub',current_setting('qa.ajeno'),true);
select pg_temp.comprobar((select count(*)=0 from public.radar_prospectos),'No miembro no ve fichas');
select pg_temp.rechaza('insert into public.radar_prospectos(empresa,fecha_lista) values(''No autorizado'',''2099-10-30'')');
rollback;
