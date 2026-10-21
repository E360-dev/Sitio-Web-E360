-- Additive workflow: stable step IDs, version-bound review and private events.
begin;
alter table public.radar_pasos add column orden integer, add column etiqueta text;
update public.radar_pasos set orden=paso*10, etiqueta=paso::text;
alter table public.radar_pasos alter column orden set not null, alter column etiqueta set not null;
create unique index radar_pasos_orden on public.radar_pasos(orden);
insert into public.radar_pasos(paso,nombre,responsable,dia,desfase,entregable,como,orden,etiqueta)
values(10,'Revisión de documentos','José Luis y Jhon','Jueves',4,
 'Versiones vigentes de los cuatro documentos aprobadas, sin correcciones pendientes',
 'JL o Jhon revisa cada documento. JD sube las correcciones como versiones nuevas; basta un visto bueno por documento.',35,'3B');
alter table public.radar_hitos add column exento_revision boolean not null default false;
insert into public.radar_hitos(prospecto_id,paso,fecha_compromiso,exento_revision)
select p.id,10,public.radar_sumar_habiles(p.fecha_lista,4),
 exists(select 1 from public.radar_hitos h where h.prospecto_id=p.id and h.paso=4 and h.fecha_real is not null)
from public.radar_prospectos p where exists(select 1 from public.radar_hitos h where h.prospecto_id=p.id);
update public.radar_accesos set pasos=array_append(pasos,10) where 4=any(pasos) and not 10=any(pasos);

create schema radar_privado;
revoke all on schema radar_privado from public,anon;
grant usage on schema radar_privado to authenticated,service_role;
create table public.radar_observaciones (
 id bigint generated always as identity primary key,
 prospecto_id bigint not null references public.radar_prospectos(id) on delete cascade,
 archivo_id bigint not null references public.radar_archivos(id) on delete cascade,
 autor uuid references auth.users(id) on delete set null,
 texto text not null check(length(btrim(texto)) between 1 and 12000),
 tipo text not null check(tipo in ('comentario','correccion')),
 origen text not null default 'portal', fuente_id bigint references public.radar_archivos(id),
 clave_importacion text unique,
 atendida_por uuid references auth.users(id) on delete set null, atendida_en timestamptz,
 resuelta_por uuid references auth.users(id) on delete set null, resuelta_en timestamptz,
 creado_en timestamptz not null default now()
);
create table public.radar_revisiones (
 archivo_id bigint primary key references public.radar_archivos(id) on delete cascade,
 aprobado_por uuid references auth.users(id) on delete set null,
 aprobado_en timestamptz not null default now()
);
create table public.radar_actividad (
 id bigint generated always as identity primary key,
 prospecto_id bigint not null references public.radar_prospectos(id) on delete cascade,
 actor uuid references auth.users(id) on delete set null,
 paso int references public.radar_pasos(paso), archivo_id bigint references public.radar_archivos(id) on delete set null,
 accion text not null, detalle text not null, creado_en timestamptz not null default now()
);
create table public.radar_notificaciones (
 id bigint generated always as identity primary key,
 usuario_id uuid not null references auth.users(id) on delete cascade,
 prospecto_id bigint references public.radar_prospectos(id) on delete cascade,
 paso int references public.radar_pasos(paso), archivo_id bigint references public.radar_archivos(id) on delete set null,
 clave text not null, titulo text not null, texto text not null,
 creado_en timestamptz not null default now(), leida_en timestamptz,
 unique(usuario_id,clave)
);
create index radar_observaciones_prospecto on public.radar_observaciones(prospecto_id,archivo_id);
create index radar_observaciones_archivo on public.radar_observaciones(archivo_id);
create index radar_observaciones_autor on public.radar_observaciones(autor);
create index radar_observaciones_fuente on public.radar_observaciones(fuente_id);
create index radar_observaciones_atendida on public.radar_observaciones(atendida_por);
create index radar_observaciones_resuelta on public.radar_observaciones(resuelta_por);
create index radar_revisiones_autor on public.radar_revisiones(aprobado_por);
create index radar_actividad_prospecto on public.radar_actividad(prospecto_id,creado_en desc);
create index radar_actividad_actor on public.radar_actividad(actor);
create index radar_actividad_archivo on public.radar_actividad(archivo_id);
create index radar_actividad_paso on public.radar_actividad(paso);
create index radar_notificaciones_usuario on public.radar_notificaciones(usuario_id,creado_en desc);
create index radar_notificaciones_prospecto on public.radar_notificaciones(prospecto_id);
create index radar_notificaciones_archivo on public.radar_notificaciones(archivo_id);
create index radar_notificaciones_paso on public.radar_notificaciones(paso);
create unique index radar_archivos_version on public.radar_archivos(prospecto_id,paso,tipo,version);
alter table public.radar_observaciones enable row level security;
alter table public.radar_revisiones enable row level security;
alter table public.radar_actividad enable row level security;
alter table public.radar_notificaciones enable row level security;
revoke all on public.radar_observaciones,public.radar_revisiones,public.radar_actividad,public.radar_notificaciones from anon,authenticated;
grant select on public.radar_observaciones,public.radar_revisiones,public.radar_actividad,public.radar_notificaciones to authenticated;
grant update(leida_en) on public.radar_notificaciones to authenticated;
create policy "radar observaciones lectura" on public.radar_observaciones for select to authenticated using ((select public.radar_tiene_acceso()));
create policy "radar revisiones lectura" on public.radar_revisiones for select to authenticated using ((select public.radar_tiene_acceso()));
create policy "radar actividad lectura" on public.radar_actividad for select to authenticated using ((select public.radar_tiene_acceso()));
create policy "radar notificaciones propias" on public.radar_notificaciones for select to authenticated using (usuario_id=(select auth.uid()) and (select public.radar_tiene_acceso()));
create policy "radar leer propias" on public.radar_notificaciones for update to authenticated
 using(usuario_id=(select auth.uid()) and (select public.radar_tiene_acceso()))
 with check(usuario_id=(select auth.uid()) and (select public.radar_tiene_acceso()));
-- Normal clients cannot forge completion, historical versions or approvals.
revoke update on public.radar_hitos from authenticated;
grant update(fecha_compromiso) on public.radar_hitos to authenticated;
revoke update,delete on public.radar_archivos from authenticated;

create function radar_privado.emitir(p_prospecto bigint,p_paso int,p_archivo bigint,p_accion text,p_detalle text,p_destinos int[] default '{}',p_actor uuid default auth.uid(),p_clave text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_evento bigint; v_empresa text;
begin
 select empresa into v_empresa from public.radar_prospectos where id=p_prospecto;
 insert into public.radar_actividad(prospecto_id,actor,paso,archivo_id,accion,detalle)
 values(p_prospecto,p_actor,p_paso,p_archivo,p_accion,p_detalle) returning id into v_evento;
 insert into public.radar_notificaciones(usuario_id,prospecto_id,paso,archivo_id,clave,titulo,texto)
 select a.user_id,p_prospecto,p_paso,p_archivo,coalesce(p_clave,'evento:'||v_evento),v_empresa,p_detalle
 from public.radar_accesos a where a.pasos && p_destinos and a.user_id is distinct from p_actor
 on conflict(usuario_id,clave) do update set texto=excluded.texto,leida_en=null,creado_en=now();
end; $$;
revoke all on function radar_privado.emitir(bigint,int,bigint,text,text,int[],uuid,text) from public,anon,authenticated;

-- Check the configured order, not the numeric predecessor. Also closes the old RPC bypass.
create function radar_privado.validar_cierre() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.fecha_real is not null and old.fecha_real is null then
  if exists(select 1 from public.radar_hitos h join public.radar_pasos p on p.paso=h.paso
   where h.prospecto_id=new.prospecto_id and h.fecha_real is null and not h.exento_revision
    and p.orden<(select orden from public.radar_pasos where paso=new.paso)) then
   raise exception 'Primero hay que cerrar los pasos anteriores, incluida la revisión 3B.';
  end if;
  if new.paso=10 and (exists(select 1 from public.radar_observaciones o where o.prospecto_id=new.prospecto_id and o.tipo='correccion' and o.resuelta_en is null)
   or (select count(*) from (select distinct on(tipo) id from public.radar_archivos where prospecto_id=new.prospecto_id and paso=3 order by tipo,version desc) a join public.radar_revisiones r on r.archivo_id=a.id)<>4) then
   raise exception 'Falta aprobar los cuatro documentos o resolver correcciones.';
  end if;
 end if;
 return new;
end; $$;
revoke all on function radar_privado.validar_cierre() from public,anon,authenticated;
create trigger radar_validar_cierre before update on public.radar_hitos for each row execute function radar_privado.validar_cierre();

create function radar_privado.hito_evento() returns trigger language plpgsql security definer set search_path='' as $$
declare v_siguiente int; v_nombre text; v_destinos int[];
begin
 if new.fecha_real is not null and old.fecha_real is null then
  select nombre into v_nombre from public.radar_pasos where paso=new.paso;
  select p.paso into v_siguiente from public.radar_pasos p join public.radar_hitos h on h.paso=p.paso
    where h.prospecto_id=new.prospecto_id and h.fecha_real is null and not h.exento_revision order by p.orden limit 1;
  v_destinos:=case when new.paso=10 then array[3,4] else array_remove(array[v_siguiente],null) end;
  perform radar_privado.emitir(new.prospecto_id,new.paso,null,'paso_completado',
   v_nombre||' completado'||case when v_siguiente is not null then '. Se habilitó: '||(select nombre from public.radar_pasos where paso=v_siguiente) else '.' end,
   case when new.paso=1 then '{}'::int[] else v_destinos end);
 elsif new.fecha_compromiso is distinct from old.fecha_compromiso then
  perform radar_privado.emitir(new.prospecto_id,new.paso,null,'fecha_modificada',
   'Nueva fecha de '||(select etiqueta from public.radar_pasos where paso=new.paso)||': '||new.fecha_compromiso,array[new.paso]);
 end if;
 return null;
end; $$;
revoke all on function radar_privado.hito_evento() from public,anon,authenticated;
create trigger radar_hito_evento after update on public.radar_hitos for each row execute function radar_privado.hito_evento();

create function radar_privado.validar_archivo() returns trigger language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid(); v_cerrado boolean;
begin
 perform 1 from public.radar_prospectos where id=new.prospecto_id for update;
 if v_uid is not null then
  if new.subido_por<>v_uid or not public.radar_puede_paso(new.paso) or new.paso not in(3,5) then raise exception 'No tienes permiso para subir este documento.'; end if;
  if new.ruta not like new.prospecto_id||'/'||new.paso||'/%' or not exists(
   select 1 from storage.objects where bucket_id='radar' and name=new.ruta and owner_id=v_uid::text
  ) then raise exception 'El archivo no corresponde a tu subida.'; end if;
  if not exists(select 1 from public.radar_hitos where prospecto_id=new.prospecto_id and paso=new.paso) then raise exception 'El prospecto no tiene este paso.'; end if;
  if new.paso=3 then
   if new.tipo not in('matriz_riesgos','guia_entendimiento','ficha_directivos','decision_pack') then raise exception 'Tipo de documento inválido.'; end if;
   if exists(select 1 from public.radar_hitos where prospecto_id=new.prospecto_id and paso=10 and (fecha_real is not null or exento_revision)) then raise exception 'La revisión 3B ya está cerrada; no se puede sustituir el contexto.'; end if;
  elsif new.paso=5 then
   if new.tipo not in('nota_ejecutiva','plan_seguimiento') then raise exception 'Tipo de documento inválido.'; end if;
   if exists(select 1 from public.radar_hitos where prospecto_id=new.prospecto_id and paso=6 and fecha_real is not null) then raise exception 'El visto bueno de la nota ya está cerrado.'; end if;
  end if;
 end if;
 select coalesce(max(version),0)+1 into new.version from public.radar_archivos where prospecto_id=new.prospecto_id and paso=new.paso and tipo=new.tipo;
 return new;
end; $$;
revoke all on function radar_privado.validar_archivo() from public,anon,authenticated;
create trigger radar_validar_archivo before insert on public.radar_archivos for each row execute function radar_privado.validar_archivo();
create function radar_privado.archivo_evento() returns trigger language plpgsql security definer set search_path='' as $$
declare v_destinos int[]:='{}';
begin
 if new.paso=3 and exists(select 1 from public.radar_hitos where prospecto_id=new.prospecto_id and paso=3 and fecha_real is not null) then v_destinos:=array[10]; end if;
 if new.paso=5 then v_destinos:=array[6]; end if;
 perform radar_privado.emitir(new.prospecto_id,new.paso,new.id,'archivo_subido','Documento disponible: '||new.nombre||' · v'||new.version,v_destinos,new.subido_por);
 return null;
end; $$;
revoke all on function radar_privado.archivo_evento() from public,anon,authenticated;
create trigger radar_archivo_evento after insert on public.radar_archivos for each row execute function radar_privado.archivo_evento();
-- Failed uploads may be removed only by their owner and only if unregistered.
create policy "radar limpiar subida propia" on storage.objects for delete to authenticated using(
 bucket_id='radar' and owner_id=(select auth.uid())::text and (select public.radar_tiene_acceso())
 and not exists(select 1 from public.radar_archivos a where a.ruta=name));

create function radar_privado.revisar(p_archivo bigint,p_accion text,p_texto text default '',p_observaciones bigint[] default '{}')
returns void language plpgsql security definer set search_path='' as $$
declare v_archivo public.radar_archivos; v_uid uuid:=auth.uid(); v_obs public.radar_observaciones; v_id bigint; v_otro public.radar_archivos;
begin
 if v_uid is null or not public.radar_tiene_acceso() then raise exception 'Sin acceso al Radar.'; end if;
 select * into v_archivo from public.radar_archivos where id=p_archivo and paso=3;
 if not found then raise exception 'Documento no encontrado.'; end if;
 perform 1 from public.radar_prospectos where id=v_archivo.prospecto_id for update;
 if p_accion='comentar' then
  if length(btrim(p_texto)) not between 1 and 12000 then raise exception 'Escribe un comentario (máximo 12000 caracteres).'; end if;
  insert into public.radar_observaciones(prospecto_id,archivo_id,autor,texto,tipo) values(v_archivo.prospecto_id,p_archivo,v_uid,btrim(p_texto),'comentario');
  perform radar_privado.emitir(v_archivo.prospecto_id,10,p_archivo,'comentario_documento',btrim(p_texto)); return;
 end if;
 if not exists(select 1 from public.radar_hitos where prospecto_id=v_archivo.prospecto_id and paso=3 and fecha_real is not null)
 or not exists(select 1 from public.radar_hitos where prospecto_id=v_archivo.prospecto_id and paso=10 and fecha_real is null and not exento_revision) then raise exception 'La revisión no está abierta.'; end if;
 if exists(select 1 from public.radar_archivos where prospecto_id=v_archivo.prospecto_id and paso=3 and tipo=v_archivo.tipo and version>v_archivo.version) then raise exception 'Hay una versión más reciente. Actualiza la pantalla.'; end if;
 if p_accion='atender' then
  if not public.radar_puede_paso(3) then raise exception 'Solo quien elabora el documento puede marcarlo atendido.'; end if;
  foreach v_id in array p_observaciones loop
   select * into v_obs from public.radar_observaciones where id=v_id and prospecto_id=v_archivo.prospecto_id and tipo='correccion' and resuelta_en is null;
   if not found then raise exception 'Observación inválida.'; end if;
   select * into v_otro from public.radar_archivos where id=v_obs.archivo_id;
   if v_otro.tipo<>v_archivo.tipo or v_archivo.version<=v_otro.version then raise exception 'Primero sube una versión nueva de este documento.'; end if;
   update public.radar_observaciones set atendida_por=v_uid,atendida_en=now() where id=v_id;
  end loop;
  perform radar_privado.emitir(v_archivo.prospecto_id,10,p_archivo,'correccion_atendida','JD marcó correcciones atendidas; falta validación del revisor.',array[10]); return;
 end if;
 if not public.radar_puede_paso(10) then raise exception 'No tienes asignada la revisión 3B.'; end if;
 if p_accion='corregir' then
  if length(btrim(p_texto)) not between 1 and 12000 then raise exception 'Explica la corrección (máximo 12000 caracteres).'; end if;
  insert into public.radar_observaciones(prospecto_id,archivo_id,autor,texto,tipo) values(v_archivo.prospecto_id,p_archivo,v_uid,btrim(p_texto),'correccion');
  perform radar_privado.emitir(v_archivo.prospecto_id,10,p_archivo,'correccion_solicitada','Corrección solicitada en '||v_archivo.nombre||': '||btrim(p_texto),array[3]); return;
 end if;
 if p_accion<>'aprobar' then raise exception 'Acción inválida.'; end if;
 for v_obs in select o.* from public.radar_observaciones o join public.radar_archivos a on a.id=o.archivo_id
  where o.prospecto_id=v_archivo.prospecto_id and a.tipo=v_archivo.tipo and o.tipo='correccion' and o.resuelta_en is null loop
  select * into v_otro from public.radar_archivos where id=v_obs.archivo_id;
  if v_archivo.version<=v_otro.version then raise exception 'Hay correcciones pendientes: JD debe subir una nueva versión.'; end if;
  if not v_obs.id=any(coalesce(p_observaciones,'{}')) then raise exception 'Confirma explícitamente la resolución de todas las observaciones de este documento.'; end if;
  update public.radar_observaciones set resuelta_por=v_uid,resuelta_en=now() where id=v_obs.id;
 end loop;
 insert into public.radar_revisiones(archivo_id,aprobado_por) values(p_archivo,v_uid) on conflict do nothing;
 if found then perform radar_privado.emitir(v_archivo.prospecto_id,10,p_archivo,'documento_aprobado','Aprobada v'||v_archivo.version||' de '||v_archivo.nombre,array[3]); end if;
 if (select count(*) from (select distinct on(tipo) id from public.radar_archivos where prospecto_id=v_archivo.prospecto_id and paso=3 order by tipo,version desc) a join public.radar_revisiones r on r.archivo_id=a.id)=4
  and not exists(select 1 from public.radar_observaciones where prospecto_id=v_archivo.prospecto_id and tipo='correccion' and resuelta_en is null) then
  update public.radar_hitos set fecha_real=current_date,completado_por=v_uid where prospecto_id=v_archivo.prospecto_id and paso=10 and fecha_real is null;
 end if;
end; $$;
revoke all on function radar_privado.revisar(bigint,text,text,bigint[]) from public,anon;
grant execute on function radar_privado.revisar(bigint,text,text,bigint[]) to authenticated;
create function public.radar_revisar_archivo(p_archivo bigint,p_accion text,p_texto text default '',p_observaciones bigint[] default '{}')
returns void language sql security invoker set search_path='' as $$ select radar_privado.revisar(p_archivo,p_accion,p_texto,p_observaciones); $$;
revoke all on function public.radar_revisar_archivo(bigint,text,text,bigint[]) from public,anon;
grant execute on function public.radar_revisar_archivo(bigint,text,text,bigint[]) to authenticated;

create function radar_privado.comentario_evento() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform radar_privado.emitir(new.prospecto_id,new.paso,null,new.tipo,new.texto,
  case when new.tipo='observacion' and new.paso=6 then array[5] else '{}'::int[] end,new.autor);
 return null;
end; $$;
revoke all on function radar_privado.comentario_evento() from public,anon,authenticated;
create trigger radar_comentario_evento after insert on public.radar_comentarios for each row execute function radar_privado.comentario_evento();
create function radar_privado.candidato_evento() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.estado='candidato' and (tg_op='INSERT' or old.estado is distinct from new.estado or old.fecha_lista is distinct from new.fecha_lista) then
  perform radar_privado.emitir(new.id,1,null,'candidato_publicado','Hay candidatos en la lista del '||new.fecha_lista||'. Revisa la lista corta.',array[2],new.creado_por,'lista:'||new.fecha_lista);
 end if; return null;
end; $$;
revoke all on function radar_privado.candidato_evento() from public,anon,authenticated;
create trigger radar_candidato_evento after insert or update on public.radar_prospectos for each row execute function radar_privado.candidato_evento();

-- Internal, owner-only daily agenda: no browser session or external mail service.
create function radar_privado.agenda(p_hoy date default (now() at time zone 'America/Bogota')::date)
returns void language plpgsql security definer set search_path='' as $$
declare v_user record; v_texto text; v_limite date:=public.radar_sumar_habiles(p_hoy,1);
begin
 if extract(isodow from p_hoy)>5 then return; end if;
 for v_user in select * from public.radar_accesos loop
  select string_agg(p.empresa||' · '||s.etiqueta||' · '||h.fecha_compromiso||case when h.fecha_compromiso<p_hoy then ' (vencido)' else '' end,E'\n' order by h.fecha_compromiso) into v_texto
  from public.radar_prospectos p join lateral (
   select hh.* from public.radar_hitos hh join public.radar_pasos ss on ss.paso=hh.paso
   where hh.prospecto_id=p.id and hh.fecha_real is null and not hh.exento_revision order by ss.orden limit 1
  ) h on true join public.radar_pasos s on s.paso=h.paso
  where p.estado in('en_curso','enviado') and h.fecha_compromiso<=v_limite and (
   (h.paso<>10 and h.paso=any(v_user.pasos)) or
   (h.paso=10 and ((3=any(v_user.pasos) and exists(select 1 from public.radar_observaciones o join public.radar_archivos a on a.id=o.archivo_id
     where o.prospecto_id=p.id and o.tipo='correccion' and o.resuelta_en is null and not exists(select 1 from public.radar_archivos n where n.prospecto_id=p.id and n.tipo=a.tipo and n.paso=3 and n.version>a.version)))
    or (10=any(v_user.pasos) and exists(select 1 from public.radar_archivos a where a.prospecto_id=p.id and a.paso=3
     and not exists(select 1 from public.radar_archivos n where n.prospecto_id=p.id and n.tipo=a.tipo and n.paso=3 and n.version>a.version)
     and not exists(select 1 from public.radar_revisiones r where r.archivo_id=a.id)
     and not exists(select 1 from public.radar_observaciones o where o.archivo_id=a.id and o.tipo='correccion' and o.resuelta_en is null))))));
  if v_texto is not null then
   insert into public.radar_notificaciones(usuario_id,clave,titulo,texto)
    values(v_user.user_id,'agenda:'||p_hoy,'Tu agenda del Radar · '||p_hoy,v_texto) on conflict(usuario_id,clave) do nothing;
  end if;
 end loop;
end; $$;
revoke all on function radar_privado.agenda(date) from public,anon,authenticated;
grant execute on function radar_privado.agenda(date) to service_role;

-- One-time source import is service-role-only and records the real importer.
create function radar_privado.importar(p_prospecto bigint,p_autor uuid,p_fuente jsonb,p_bloques jsonb,p_general text)
returns bigint language plpgsql security definer set search_path='' as $$
declare v_fuente bigint; v_item jsonb; v_archivo bigint; v_clave text:=p_fuente->>'sha256';
begin
 if not exists(select 1 from public.radar_accesos where user_id=p_autor and 3=any(pasos)) then raise exception 'Importador no autorizado.'; end if;
 perform 1 from public.radar_prospectos where id=p_prospecto for update;
 select fuente_id into v_fuente from public.radar_observaciones where clave_importacion like v_clave||':%' limit 1;
 if v_fuente is not null then return v_fuente; end if;
 if not exists(select 1 from storage.objects where bucket_id='radar' and name=p_fuente->>'ruta') then raise exception 'Falta el archivo original.'; end if;
 insert into public.radar_archivos(prospecto_id,paso,tipo,nombre,ruta,subido_por)
 values(p_prospecto,10,'comentarios_externos',p_fuente->>'nombre',p_fuente->>'ruta',p_autor) returning id into v_fuente;
 for v_item in select * from jsonb_array_elements(p_bloques) loop
  select id into v_archivo from public.radar_archivos where prospecto_id=p_prospecto and paso=3 and tipo=v_item->>'tipo' order by version desc limit 1;
  if v_archivo is null then raise exception 'Falta el documento de destino.'; end if;
  insert into public.radar_observaciones(prospecto_id,archivo_id,autor,texto,tipo,origen,fuente_id,clave_importacion)
  values(p_prospecto,v_archivo,p_autor,v_item->>'texto','correccion','Comentarios externos importados por JD',v_fuente,v_clave||':'||(v_item->>'tipo'));
  perform radar_privado.emitir(p_prospecto,10,v_archivo,'comentarios_importados','Comentarios externos importados por JD; se requiere una nueva versión.',array[3],p_autor);
 end loop;
 insert into public.radar_comentarios(prospecto_id,paso,tipo,texto,autor)
 values(p_prospecto,10,'comentario','Comentarios externos importados por JD. Contexto general del original:'||E'\n'||p_general,p_autor);
 return v_fuente;
end; $$;
revoke all on function radar_privado.importar(bigint,uuid,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function radar_privado.importar(bigint,uuid,jsonb,jsonb,text) to service_role;
create function public.radar_importar_revision(p_prospecto bigint,p_autor uuid,p_fuente jsonb,p_bloques jsonb,p_general text)
returns bigint language sql security invoker set search_path='' as $$ select radar_privado.importar(p_prospecto,p_autor,p_fuente,p_bloques,p_general); $$;
revoke all on function public.radar_importar_revision(bigint,uuid,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.radar_importar_revision(bigint,uuid,jsonb,jsonb,text) to service_role;

-- Publication addition is scoped, and safe on projects already using Realtime.
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='radar_notificaciones') then
  alter publication supabase_realtime add table public.radar_notificaciones;
 end if;
end $$;
create extension if not exists pg_cron;
select cron.schedule('radar-agenda-bogota','0 14 * * 1-5','select radar_privado.agenda();');
notify pgrst,'reload schema';
commit;
