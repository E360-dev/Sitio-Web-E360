-- Stable IDs: 10 remains 3B; 11 is the internal handoff (7B). 8/9 stay intact.
begin;

do $$ begin
 if (select count(*) from public.radar_accesos where nombre='JD')<>1
    or (select count(*) from public.radar_accesos where nombre='José Luis')<>1 then
  raise exception 'Identifica una única cuenta de JD y José Luis antes de cambiar el flujo.';
 end if;
end $$;

update public.radar_pasos set nombre='Autorizar envío a Arturo', responsable='José Luis',
 entregable='Autorización de José Luis para que JD envíe la nota ejecutiva y el plan de acercamiento a Arturo',
 como='José Luis autoriza el envío interno después del visto bueno. JD queda habilitado para enviar la información por correo a Arturo, con copia a José Luis, Luna y Diego.'
where paso=7;

insert into public.radar_pasos(paso,nombre,responsable,dia,desfase,entregable,como,orden,etiqueta)
values(11,'Enviar nota y plan a Arturo','JD','Jueves, después de la autorización',9,
 'Correo a Arturo con la nota ejecutiva y el plan de acercamiento vigentes, con copia a José Luis, Luna y Diego',
 'JD envía el correo después de la autorización de José Luis y registra el envío en el portal. Arturo recibe la información para realizar el acercamiento al prospecto.',75,'7B');

update public.radar_pasos set como='Después de recibir la nota ejecutiva y el plan de acercamiento, Arturo aprueba y envía el correo al prospecto. Registrar en el portal la fecha real del envío de Arturo.' where paso=8;
update public.radar_pasos set nombre='Redactar nota ejecutiva y plan de acercamiento',
 entregable='Nota ejecutiva y plan de acercamiento y seguimiento (contactos, correos y secuencia)',
 como='JD redacta con base en el enfoque y sube la nota ejecutiva y el plan de acercamiento y seguimiento.' where paso=5;

-- Explicit authorization by José Luis; the review permission of Luna is kept.
update public.radar_accesos set pasos=array_remove(pasos,7) where nombre<>'José Luis' and 7=any(pasos);
update public.radar_accesos set pasos=array_append(pasos,7) where nombre='José Luis' and not 7=any(pasos);
update public.radar_accesos set pasos=array_append(pasos,11) where nombre='JD' and not 11=any(pasos);
-- Operational recorder: JD may register Arturo's external send; the visible
-- owner remains Arturo, and completado_por still records the actual operator.
update public.radar_accesos set pasos=array_append(pasos,8) where nombre='JD' and not 8=any(pasos);

-- Add the handoff to existing dossiers without fabricating a historical email.
-- Completed external sends are exempt so history is never reopened.
insert into public.radar_hitos(prospecto_id,paso,fecha_compromiso,exento_revision)
select p.id,11,coalesce(h7.fecha_compromiso,public.radar_sumar_habiles(p.fecha_lista,9)),
 p.estado in ('enviado','en_seguimiento') or exists(select 1 from public.radar_hitos hx where hx.prospecto_id=p.id and hx.paso in (8,9) and hx.fecha_real is not null)
from public.radar_prospectos p left join public.radar_hitos h7 on h7.prospecto_id=p.id and h7.paso=7
where exists(select 1 from public.radar_hitos h where h.prospecto_id=p.id)
on conflict(prospecto_id,paso) do nothing;

create or replace function public.radar_completar_paso(p_prospecto bigint,p_paso int,p_texto text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_prospecto public.radar_prospectos; v_hito public.radar_hitos; v_orden int; v_faltan text[]; v_documentos text;
begin
 if auth.uid() is null or not public.radar_puede_paso(p_paso) then
  raise exception 'No tienes asignado el paso %.',p_paso using errcode='42501';
 end if;
 if p_paso<3 then raise exception 'Los pasos 1 y 2 se cierran al elegir el prospecto.'; end if;
 if p_paso=10 then raise exception 'La revisión 3B se cierra al aprobar los cuatro documentos.'; end if;
 select * into v_prospecto from public.radar_prospectos where id=p_prospecto for update;
 if not found then raise exception 'El prospecto no existe.'; end if;
 select * into v_hito from public.radar_hitos where prospecto_id=p_prospecto and paso=p_paso;
 if not found then raise exception 'Este paso no está creado para el prospecto.'; end if;
 if v_hito.fecha_real is not null or v_hito.exento_revision then raise exception 'Este paso ya está cerrado o no es exigible.'; end if;
 select orden into v_orden from public.radar_pasos where paso=p_paso;
 if exists(select 1 from public.radar_hitos h join public.radar_pasos s on s.paso=h.paso
  where h.prospecto_id=p_prospecto and s.orden<v_orden and h.fecha_real is null and not h.exento_revision) then
  raise exception 'Primero hay que cerrar los pasos anteriores, incluida la autorización y el envío interno cuando corresponda.';
 end if;

 if p_paso=3 then
  select array_agg(t) into v_faltan from unnest(array['matriz_riesgos','guia_entendimiento','ficha_directivos','decision_pack']) t
  where not exists(select 1 from public.radar_archivos where prospecto_id=p_prospecto and paso=3 and tipo=t);
  if v_faltan is not null then raise exception 'Faltan documentos de contexto: %.',array_to_string(v_faltan,', '); end if;
 elsif p_paso=4 then
  if coalesce(trim(v_prospecto.enfoque_servicio),'')='' or coalesce(trim(v_prospecto.enfoque_angulo),'')='' or coalesce(trim(v_prospecto.enfoque_cuidar),'')='' then
   raise exception 'Falta llenar el enfoque: servicio, ángulo central y qué cuidar.';
  end if;
 elsif p_paso in (5,7,11) then
  if not exists(select 1 from public.radar_archivos where prospecto_id=p_prospecto and paso=5 and tipo='nota_ejecutiva')
    or not exists(select 1 from public.radar_archivos where prospecto_id=p_prospecto and paso=5 and tipo='plan_seguimiento') then
   raise exception 'Faltan la nota ejecutiva o el plan de acercamiento.';
  end if;
 elsif p_paso=8 then
  if v_prospecto.fecha_envio is null then raise exception 'Falta registrar la fecha de envío.'; end if;
 elsif p_paso=9 then
  if coalesce(trim(v_prospecto.crm_url),'')='' then raise exception 'Falta el enlace del prospecto en el CRM.'; end if;
 end if;
 if p_paso=11 and p_texto is distinct from 'Confirmo que envié por correo a Arturo la nota ejecutiva y el plan de acercamiento vigentes, con copia a José Luis, Luna y Diego.' then
  raise exception 'Confirma el envío de ambos documentos a Arturo, con copia a José Luis, Luna y Diego.';
 end if;

 update public.radar_hitos set fecha_real=(now() at time zone 'America/Bogota')::date,completado_por=auth.uid()
 where prospecto_id=p_prospecto and paso=p_paso;
 if p_paso=6 then
  insert into public.radar_comentarios(prospecto_id,paso,tipo,texto) values(p_prospecto,6,'visto_bueno',coalesce(nullif(trim(p_texto),''),'Visto bueno.'));
 elsif p_paso=7 then
  insert into public.radar_comentarios(prospecto_id,paso,tipo,texto) values(p_prospecto,7,'visto_bueno','Autorizo a JD a enviar la nota ejecutiva y el plan de acercamiento a Arturo, con copia a José Luis, Luna y Diego.');
 elsif p_paso=11 then
  select string_agg(a.tipo||' v'||a.version||' · '||a.nombre||' (archivo '||a.id||')',E'\n' order by a.tipo) into v_documentos
  from (select distinct on(tipo) tipo,version,nombre,id from public.radar_archivos where prospecto_id=p_prospecto and paso=5 and tipo in ('nota_ejecutiva','plan_seguimiento') order by tipo,version desc) a;
  insert into public.radar_comentarios(prospecto_id,paso,tipo,texto) values(p_prospecto,11,'comentario',p_texto||E'\nDocumentos vigentes al registrar el envío:\n'||v_documentos);
 elsif p_paso=8 then
  update public.radar_prospectos set estado='enviado' where id=p_prospecto;
 elsif p_paso=9 then
  update public.radar_prospectos set estado='en_seguimiento' where id=p_prospecto;
 end if;
end; $$;
revoke all on function public.radar_completar_paso(bigint,int,text) from public,anon;
grant execute on function public.radar_completar_paso(bigint,int,text) to authenticated;
notify pgrst,'reload schema';
commit;
