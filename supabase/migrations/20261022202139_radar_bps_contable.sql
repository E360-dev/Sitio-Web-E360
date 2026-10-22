-- Independent BPS inventory. No changes to Radar Comercial or technology accounts.
begin;
create schema bps_privado;
revoke all on schema bps_privado from public, anon;
grant usage on schema bps_privado to authenticated;

create table public.bps_accesos (
 user_id uuid primary key references auth.users(id) on delete cascade,
 nombre text not null check (length(trim(nombre)) between 1 and 160),
 carga boolean not null default false,
 gestion boolean not null default false,
 activo boolean not null default true,
 creado_en timestamptz not null default now()
);
create table public.bps_corridas (
 id bigint generated always as identity primary key,
 nombre text not null check (length(trim(nombre)) between 1 and 200),
 fecha date not null default current_date,
 criterios text not null default '',
 notas text not null default '',
 revision integer not null default 1,
 creado_por uuid references auth.users(id) on delete set null,
 creado_en timestamptz not null default now(),
 actualizado_en timestamptz not null default now()
);
create table public.bps_oportunidades (
 id bigint generated always as identity primary key,
 corrida_id bigint not null references public.bps_corridas(id),
 nombre text not null check (length(trim(nombre)) between 1 and 200),
 tamano text not null default '',
 tipo text not null default 'directa' check(tipo in ('directa','canal')),
 fit text check(fit in ('A','B','C')),
 multiplicador numeric check(multiplicador in (1,1.5,2)),
 prioridad integer generated always as (case
  when fit is null or multiplicador is null then 0
  when fit='A' and multiplicador=2 then 4
  when (fit='A' and multiplicador=1.5) or (fit='B' and multiplicador=2) then 3
  when (fit='A' and multiplicador=1) or (fit='B' and multiplicador=1.5) then 2
  else 1 end) stored,
 detonante text not null default '',
 dolor text not null default '',
 persona_objetivo text not null default '',
 ruta_acceso text not null default '',
 canal_contacto text not null default '',
 siguiente_accion text not null default '',
 fuentes text not null default '',
 pais text not null default '',
 sector text not null default '',
 sitio_web text not null default '' check(sitio_web='' or sitio_web ~* '^https?://[^[:space:]]+$'),
 ingresos numeric check(ingresos>=0),
 moneda text not null default 'MXN' check(moneda ~ '^[A-Z]{3}$'),
 responsable_id uuid references public.bps_accesos(user_id) on delete set null,
 crm_url text not null default '' check(crm_url='' or crm_url ~* '^https?://[^[:space:]]+$'),
 estado text not null default 'nueva' check(estado in ('nueva','validada','en_contacto','descartada')),
 motivo_estado text not null default '',
 revision integer not null default 1,
 creado_por uuid references auth.users(id) on delete set null,
 creado_en timestamptz not null default now(),
 actualizado_en timestamptz not null default now()
);
create table public.bps_comentarios (
 id bigint generated always as identity primary key,
 oportunidad_id bigint not null references public.bps_oportunidades(id),
 texto text not null check(length(trim(texto)) between 1 and 10000),
 autor uuid references auth.users(id) on delete set null,
 autor_nombre text not null,
 creado_en timestamptz not null default now()
);
create table public.bps_actividad (
 id bigint generated always as identity primary key,
 oportunidad_id bigint references public.bps_oportunidades(id),
 corrida_id bigint references public.bps_corridas(id),
 evento text not null,
 autor uuid references auth.users(id) on delete set null,
 autor_nombre text not null,
 detalle jsonb not null default '{}',
 creado_en timestamptz not null default now()
);
create index bps_corridas_fecha on public.bps_corridas(fecha desc,id desc);
create index bps_corridas_autor on public.bps_corridas(creado_por);
create index bps_oportunidades_corrida on public.bps_oportunidades(corrida_id);
create index bps_oportunidades_listado on public.bps_oportunidades(prioridad desc,creado_en desc,id desc);
create index bps_oportunidades_estado on public.bps_oportunidades(estado);
create index bps_oportunidades_responsable on public.bps_oportunidades(responsable_id);
create index bps_oportunidades_autor on public.bps_oportunidades(creado_por);
create index bps_comentarios_oportunidad on public.bps_comentarios(oportunidad_id,id);
create index bps_comentarios_autor on public.bps_comentarios(autor);
create index bps_actividad_oportunidad on public.bps_actividad(oportunidad_id,id);
create index bps_actividad_corrida on public.bps_actividad(corrida_id,id);
create index bps_actividad_autor on public.bps_actividad(autor);

-- Private, non-exposed authorization helper. Uses live role/membership, never user_metadata.
create function bps_privado.puede(p_capacidad text default '') returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from public.bps_accesos a join public.roles_usuario r on r.user_id=a.user_id
  where a.user_id=auth.uid() and a.activo and r.rol in ('admin','auditor','comercial','comunicacion')
   and case p_capacidad when 'carga' then a.carga when 'gestion' then a.gestion when '' then true else false end
 );
$$;
revoke all on function bps_privado.puede(text) from public,anon;
grant execute on function bps_privado.puede(text) to authenticated;

alter table public.bps_accesos enable row level security;
alter table public.bps_corridas enable row level security;
alter table public.bps_oportunidades enable row level security;
alter table public.bps_comentarios enable row level security;
alter table public.bps_actividad enable row level security;
create policy bps_accesos_lectura on public.bps_accesos for select to authenticated
 using ((select bps_privado.puede()) or (select public.tiene_rol(array['admin'])));
create policy bps_corridas_lectura on public.bps_corridas for select to authenticated using ((select bps_privado.puede()));
create policy bps_oportunidades_lectura on public.bps_oportunidades for select to authenticated using ((select bps_privado.puede()));
create policy bps_comentarios_lectura on public.bps_comentarios for select to authenticated using ((select bps_privado.puede()));
create policy bps_actividad_lectura on public.bps_actividad for select to authenticated using ((select bps_privado.puede()));
revoke all on public.bps_accesos,public.bps_corridas,public.bps_oportunidades,public.bps_comentarios,public.bps_actividad from anon,authenticated;
grant select on public.bps_accesos,public.bps_corridas,public.bps_oportunidades,public.bps_comentarios,public.bps_actividad to authenticated;
grant all on public.bps_accesos,public.bps_corridas,public.bps_oportunidades,public.bps_comentarios,public.bps_actividad to service_role;
grant usage,select on sequence public.bps_corridas_id_seq,public.bps_oportunidades_id_seq,public.bps_comentarios_id_seq,public.bps_actividad_id_seq to service_role;

-- Every write validates fields, capabilities and optimistic revision under a row lock.
-- The elevated implementation is private; its only exposed bridge is SECURITY INVOKER.
create function bps_privado.ejecutar(p_accion text,p_datos jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 v_uid uuid:=auth.uid(); v_nombre text; v_carga boolean; v_gestion boolean;
 v_campos jsonb:=coalesce(p_datos->'campos','{}'::jsonb); v_clave text;
 v_permitidos text[]; v_id bigint; v_revision integer; v_antes jsonb; v_despues jsonb;
 v_o public.bps_oportunidades; v_c public.bps_corridas; v_destino text; v_motivo text;
begin
 if v_uid is null or jsonb_typeof(p_datos)<>'object' or octet_length(p_datos::text)>100000 then
  raise exception 'Solicitud no autorizada o inválida.' using errcode='42501'; end if;
 if p_accion in ('acceso_guardar','acceso_quitar') then
  if not public.tiene_rol(array['admin']) then raise exception 'Solo administración puede gestionar accesos.' using errcode='42501'; end if;
  if exists(select 1 from jsonb_object_keys(p_datos) k where k not in ('user_id','nombre','carga','gestion')) then raise exception 'Campos de acceso no permitidos.'; end if;
  if p_accion='acceso_guardar' then
   if not exists(select 1 from public.roles_usuario where user_id=(p_datos->>'user_id')::uuid and rol in ('admin','auditor','comercial','comunicacion')) then raise exception 'Selecciona una cuenta interna existente.'; end if;
   insert into public.bps_accesos(user_id,nombre,carga,gestion) values
    ((p_datos->>'user_id')::uuid,trim(p_datos->>'nombre'),coalesce((p_datos->>'carga')::boolean,false),coalesce((p_datos->>'gestion')::boolean,false))
   on conflict(user_id) do update set nombre=excluded.nombre,carga=excluded.carga,gestion=excluded.gestion,activo=true;
  else
   update public.bps_accesos set activo=false where user_id=(p_datos->>'user_id')::uuid;
  end if;
  insert into public.bps_actividad(evento,autor,autor_nombre,detalle) values(p_accion,v_uid,'Administración',p_datos);
  return jsonb_build_object('ok',true);
 end if;
 if not bps_privado.puede() then raise exception 'No tienes acceso al Radar BPS.' using errcode='42501'; end if;
 select nombre,carga,gestion into v_nombre,v_carga,v_gestion from public.bps_accesos where user_id=v_uid;
 if jsonb_typeof(v_campos)<>'object' then raise exception 'Campos inválidos.'; end if;
 if exists(select 1 from jsonb_object_keys(p_datos) k where k not in ('id','revision','campos','estado','motivo','texto')) then raise exception 'Campos no permitidos.'; end if;
 v_id:=(p_datos->>'id')::bigint;
 v_revision:=(p_datos->>'revision')::integer;

 if p_accion='tanda_guardar' then
  if not v_carga then raise exception 'No tienes permiso de carga.' using errcode='42501'; end if;
  if exists(select 1 from jsonb_object_keys(v_campos) k where k not in ('nombre','fecha','criterios','notas')) then raise exception 'Campos de tanda no permitidos.'; end if;
  if v_id is null then
   v_c:=jsonb_populate_record(null::public.bps_corridas,jsonb_build_object('fecha',current_date,'criterios','','notas','')||v_campos);
   insert into public.bps_corridas(nombre,fecha,criterios,notas,creado_por) values(v_c.nombre,v_c.fecha,v_c.criterios,v_c.notas,v_uid) returning * into v_c;
  else
   select * into v_c from public.bps_corridas where id=v_id for update;
   if not found then raise exception 'La tanda no existe.'; end if;
   if v_revision is distinct from v_c.revision then raise exception 'Otra persona modificó este registro. Recarga antes de guardar.' using errcode='40001'; end if;
   v_antes:=to_jsonb(v_c); v_c:=jsonb_populate_record(v_c,v_campos);
   update public.bps_corridas set nombre=v_c.nombre,fecha=v_c.fecha,criterios=v_c.criterios,notas=v_c.notas,revision=revision+1,actualizado_en=now() where id=v_id returning * into v_c;
  end if;
  insert into public.bps_actividad(corrida_id,evento,autor,autor_nombre,detalle) values(v_c.id,case when v_id is null then 'tanda_creada' else 'tanda_editada' end,v_uid,v_nombre,jsonb_build_object('antes',v_antes,'despues',to_jsonb(v_c)));
  return to_jsonb(v_c);
 elsif p_accion='oportunidad_guardar' then
  if not (v_carga or v_gestion) then raise exception 'No tienes permiso para editar oportunidades.' using errcode='42501'; end if;
  v_permitidos:=array[]::text[];
  if v_carga then v_permitidos:=array['corrida_id','nombre','tamano','tipo','fit','multiplicador','detonante','dolor','persona_objetivo','ruta_acceso','canal_contacto','siguiente_accion','fuentes','pais','sector','sitio_web','ingresos','moneda']; end if;
  if v_gestion then v_permitidos:=v_permitidos||array['fit','multiplicador','persona_objetivo','ruta_acceso','canal_contacto','siguiente_accion','responsable_id','crm_url']; end if;
  if exists(select 1 from jsonb_object_keys(v_campos) k where not(k=any(v_permitidos))) then raise exception 'No tienes permiso para modificar esos campos.' using errcode='42501'; end if;
  if v_id is null then
   if not v_carga then raise exception 'No tienes permiso de carga.' using errcode='42501'; end if;
   v_o:=jsonb_populate_record(null::public.bps_oportunidades,jsonb_build_object('tipo','directa','tamano','','detonante','','dolor','','persona_objetivo','','ruta_acceso','','canal_contacto','','siguiente_accion','','fuentes','','pais','','sector','','sitio_web','','moneda','MXN','crm_url','')||v_campos);
   if v_o.responsable_id is null then select user_id into v_o.responsable_id from public.bps_accesos where activo and gestion order by creado_en,user_id limit 1; end if;
  else
   select * into v_o from public.bps_oportunidades where id=v_id for update;
   if not found then raise exception 'La oportunidad no existe.'; end if;
   if v_revision is distinct from v_o.revision then raise exception 'Otra persona modificó este registro. Recarga antes de guardar.' using errcode='40001'; end if;
   v_antes:=to_jsonb(v_o); v_o:=jsonb_populate_record(v_o,v_campos);
  end if;
  if v_o.responsable_id is not null and (v_id is null or v_campos?'responsable_id') and not exists(select 1 from public.bps_accesos a join public.roles_usuario r on r.user_id=a.user_id where a.user_id=v_o.responsable_id and a.activo and a.gestion and r.rol in ('admin','auditor','comercial','comunicacion')) then raise exception 'El responsable debe tener gestión BPS activa.'; end if;
  if v_id is null then
   insert into public.bps_oportunidades(corrida_id,nombre,tamano,tipo,fit,multiplicador,detonante,dolor,persona_objetivo,ruta_acceso,canal_contacto,siguiente_accion,fuentes,pais,sector,sitio_web,ingresos,moneda,responsable_id,crm_url,creado_por)
   values(v_o.corrida_id,v_o.nombre,v_o.tamano,v_o.tipo,v_o.fit,v_o.multiplicador,v_o.detonante,v_o.dolor,v_o.persona_objetivo,v_o.ruta_acceso,v_o.canal_contacto,v_o.siguiente_accion,v_o.fuentes,v_o.pais,v_o.sector,v_o.sitio_web,v_o.ingresos,v_o.moneda,v_o.responsable_id,v_o.crm_url,v_uid) returning * into v_o;
  else
   update public.bps_oportunidades set corrida_id=v_o.corrida_id,nombre=v_o.nombre,tamano=v_o.tamano,tipo=v_o.tipo,fit=v_o.fit,multiplicador=v_o.multiplicador,detonante=v_o.detonante,dolor=v_o.dolor,persona_objetivo=v_o.persona_objetivo,ruta_acceso=v_o.ruta_acceso,canal_contacto=v_o.canal_contacto,siguiente_accion=v_o.siguiente_accion,fuentes=v_o.fuentes,pais=v_o.pais,sector=v_o.sector,sitio_web=v_o.sitio_web,ingresos=v_o.ingresos,moneda=v_o.moneda,responsable_id=v_o.responsable_id,crm_url=v_o.crm_url,revision=revision+1,actualizado_en=now() where id=v_id returning * into v_o;
  end if;
  insert into public.bps_actividad(oportunidad_id,corrida_id,evento,autor,autor_nombre,detalle) values(v_o.id,v_o.corrida_id,case when v_id is null then 'oportunidad_creada' else 'oportunidad_editada' end,v_uid,v_nombre,jsonb_build_object('antes',v_antes,'despues',to_jsonb(v_o)));
  return to_jsonb(v_o);
 elsif p_accion='estado' then
  if not v_gestion then raise exception 'No tienes permiso de gestión.' using errcode='42501'; end if;
  select * into v_o from public.bps_oportunidades where id=v_id for update;
  if not found then raise exception 'La oportunidad no existe.'; end if;
  if v_revision is distinct from v_o.revision then raise exception 'Otra persona modificó este registro. Recarga antes de guardar.' using errcode='40001'; end if;
  v_destino:=p_datos->>'estado'; v_motivo:=trim(coalesce(p_datos->>'motivo',''));
  if v_destino is null or not ((v_o.estado='nueva' and v_destino='validada') or (v_o.estado='validada' and v_destino='en_contacto') or (v_destino='descartada' and v_o.estado<>'descartada') or (v_destino='nueva' and v_o.estado<>'nueva')) then raise exception 'Cambio de estado no permitido.'; end if;
  if v_destino in ('nueva','descartada') and v_motivo='' then raise exception 'Escribe el motivo del cambio.'; end if;
  v_antes:=to_jsonb(v_o);
  update public.bps_oportunidades set estado=v_destino,motivo_estado=v_motivo,revision=revision+1,actualizado_en=now() where id=v_id returning * into v_o;
  insert into public.bps_actividad(oportunidad_id,corrida_id,evento,autor,autor_nombre,detalle) values(v_id,v_o.corrida_id,'estado_cambiado',v_uid,v_nombre,jsonb_build_object('antes',v_antes->>'estado','despues',v_destino,'motivo',v_motivo));
  return to_jsonb(v_o);
 elsif p_accion='comentar' then
  select * into v_o from public.bps_oportunidades where id=v_id for update;
  if not found then raise exception 'La oportunidad no existe.'; end if;
  insert into public.bps_comentarios(oportunidad_id,texto,autor,autor_nombre) values(v_id,trim(p_datos->>'texto'),v_uid,v_nombre);
  insert into public.bps_actividad(oportunidad_id,corrida_id,evento,autor,autor_nombre) values(v_id,v_o.corrida_id,'comentario_agregado',v_uid,v_nombre);
  return jsonb_build_object('ok',true);
 else raise exception 'Operación BPS no reconocida.';
 end if;
end;
$$;
revoke all on function bps_privado.ejecutar(text,jsonb) from public,anon;
grant execute on function bps_privado.ejecutar(text,jsonb) to authenticated;
create function public.bps_ejecutar(p_accion text,p_datos jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$ select bps_privado.ejecutar(p_accion,p_datos); $$;
revoke all on function public.bps_ejecutar(text,jsonb) from public,anon;
grant execute on function public.bps_ejecutar(text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
