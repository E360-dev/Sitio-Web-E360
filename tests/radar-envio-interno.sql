-- Real roles, notifications and workflow, all reverted at the end.
begin;
create function pg_temp.comprobar(ok boolean,mensaje text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'PRUEBA: %',mensaje; end if; end $$;
create function pg_temp.actor(nombre text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub',current_setting('qa.'||nombre),true); end $$;
create function pg_temp.rechaza(sql text, esperado text) returns void language plpgsql as $$
begin
 begin execute sql; exception when others then
  if sqlerrm not like '%'||esperado||'%' then raise exception 'PRUEBA: error inesperado %',sqlerrm; end if; return;
 end;
 raise exception 'PRUEBA: se aceptó una operación prohibida';
end $$;
do $$ declare nombre text; uid uuid; permisos int[]; begin
 foreach nombre in array array['jd','jl','luna','arturo','diego'] loop
  uid:=gen_random_uuid(); perform set_config('qa.'||nombre,uid::text,true);
  permisos:=case nombre when 'jd' then array[1,3,5,8,11] when 'jl' then array[2,4,6,7,10] when 'luna' then array[2,4,6,10] when 'arturo' then array[8] else array[9] end;
  insert into auth.users(id,email,role,aud) values(uid,'qa-envio-'||uid||'@example.test','authenticated','authenticated');
  insert into public.radar_accesos(user_id,nombre,pasos) values(uid,'QA '||nombre,permisos);
 end loop;
end $$;
set local role authenticated;
select pg_temp.actor('jd');
do $$ declare pid bigint; begin
 insert into public.radar_prospectos(empresa,fecha_lista) values('QA envío interno','2099-11-06') returning id into pid;
 perform set_config('qa.prospecto',pid::text,true);
end $$;
select pg_temp.actor('jl');
select public.radar_elegir(current_setting('qa.prospecto')::bigint);
select pg_temp.comprobar((select count(*)=11 from public.radar_hitos where prospecto_id=current_setting('qa.prospecto')::bigint),'Elegir crea once hitos');
select pg_temp.comprobar((select fecha_compromiso=public.radar_sumar_habiles('2099-11-06',9) from public.radar_hitos where prospecto_id=current_setting('qa.prospecto')::bigint and paso=11),'7B se programa el jueves');
-- Isolate the downstream workflow under test; earlier stages have their own suite.
reset role;
delete from public.radar_hitos where prospecto_id=current_setting('qa.prospecto')::bigint;
insert into public.radar_hitos(prospecto_id,paso,fecha_compromiso,fecha_real,exento_revision)
select current_setting('qa.prospecto')::bigint,paso,current_date,case when orden<50 and paso<>10 then current_date else null end,paso=10 from public.radar_pasos;
insert into storage.objects(bucket_id,name,owner_id)
select 'radar',current_setting('qa.prospecto')||'/5/'||t||'.pdf',current_setting('qa.jd') from unnest(array['nota_ejecutiva','plan_seguimiento']) t;
set local role authenticated;
select pg_temp.actor('jd');
insert into public.radar_archivos(prospecto_id,paso,tipo,nombre,ruta,version,subido_por)
select current_setting('qa.prospecto')::bigint,5,t,t||'.pdf',current_setting('qa.prospecto')||'/5/'||t||'.pdf',1,auth.uid() from unnest(array['nota_ejecutiva','plan_seguimiento']) t;
select pg_temp.rechaza('select public.radar_completar_paso('||current_setting('qa.prospecto')||',11,''Confirmación'')','pasos anteriores');
select public.radar_completar_paso(current_setting('qa.prospecto')::bigint,5);
select pg_temp.actor('jl');
select pg_temp.rechaza('select public.radar_completar_paso('||current_setting('qa.prospecto')||',7)','pasos anteriores');
select public.radar_completar_paso(current_setting('qa.prospecto')::bigint,6);
select pg_temp.actor('luna');
select pg_temp.rechaza('select public.radar_completar_paso('||current_setting('qa.prospecto')||',7)','No tienes asignado');
select pg_temp.actor('jd');
select pg_temp.rechaza('select public.radar_completar_paso('||current_setting('qa.prospecto')||',7)','No tienes asignado');
select pg_temp.actor('jl');
select public.radar_completar_paso(current_setting('qa.prospecto')::bigint,7);
select pg_temp.actor('jd');
select pg_temp.comprobar(exists(select 1 from public.radar_notificaciones where usuario_id=auth.uid() and prospecto_id=current_setting('qa.prospecto')::bigint and paso=7 and texto like '%Enviar nota y plan a Arturo%'),'Autorización notifica a JD');
select pg_temp.rechaza('select public.radar_completar_paso('||current_setting('qa.prospecto')||',11)','Confirma el envío');
select pg_temp.rechaza('update public.radar_hitos set fecha_real=current_date where prospecto_id='||current_setting('qa.prospecto')||' and paso=11','permission denied');
select pg_temp.actor('arturo');
select pg_temp.rechaza('select public.radar_completar_paso('||current_setting('qa.prospecto')||',8)','pasos anteriores');
select pg_temp.rechaza('select public.radar_completar_paso('||current_setting('qa.prospecto')||',11)','No tienes asignado');
select pg_temp.actor('jd');
select public.radar_completar_paso(current_setting('qa.prospecto')::bigint,11,'Confirmo que envié por correo a Arturo la nota ejecutiva y el plan de acercamiento vigentes, con copia a José Luis, Luna y Diego.');
select pg_temp.comprobar((select estado='en_curso' from public.radar_prospectos where id=current_setting('qa.prospecto')::bigint),'Correo interno no cambia a enviado al prospecto');
select pg_temp.comprobar(exists(select 1 from public.radar_comentarios where prospecto_id=current_setting('qa.prospecto')::bigint and paso=11 and texto like '%copia a José Luis, Luna y Diego%' and texto like '%nota_ejecutiva v1%' and texto like '%plan_seguimiento v1%'),'Registro incluye copias y versiones de ambos documentos');
select pg_temp.rechaza('select public.radar_completar_paso('||current_setting('qa.prospecto')||',11)','cerrado');
select pg_temp.actor('arturo');
select pg_temp.comprobar(exists(select 1 from public.radar_notificaciones where usuario_id=auth.uid() and prospecto_id=current_setting('qa.prospecto')::bigint and paso=11),'Correo registrado notifica a Arturo');
select pg_temp.actor('jd');
select pg_temp.comprobar((select responsable='Arturo' from public.radar_pasos where paso=8),'Arturo conserva la responsabilidad visible');
update public.radar_prospectos set fecha_envio=current_date where id=current_setting('qa.prospecto')::bigint;
select public.radar_completar_paso(current_setting('qa.prospecto')::bigint,8);
select pg_temp.comprobar((select completado_por=auth.uid() from public.radar_hitos where prospecto_id=current_setting('qa.prospecto')::bigint and paso=8),'JD registra el envío de Arturo con su propia identidad');
select pg_temp.comprobar((select estado='enviado' from public.radar_prospectos where id=current_setting('qa.prospecto')::bigint),'Registro de JD confirma el envío externo de Arturo');
select pg_temp.actor('diego');
update public.radar_prospectos set crm_url='https://example.test/crm' where id=current_setting('qa.prospecto')::bigint;
select public.radar_completar_paso(current_setting('qa.prospecto')::bigint,9);
select pg_temp.comprobar((select estado='en_seguimiento' from public.radar_prospectos where id=current_setting('qa.prospecto')::bigint),'Seguimiento conserva su funcionamiento');
select 'OK: autorización JL, envío JD, copias, versiones, permisos, orden, notificaciones y envío externo.' as resultado;
rollback;
