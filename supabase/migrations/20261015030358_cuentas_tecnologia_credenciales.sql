-- Metadata stays readable to admins; encrypted credentials and unlock grants
-- live outside the exposed schemas. Only the Edge Function can use the gateway.
begin;

alter table public.cuentas_tecnologia
  add column correo text not null default '',
  add column uso text not null default '',
  add column fecha_renovacion date,
  add column tiene_contrasena boolean not null default false;
create index cuentas_tecnologia_creado_por_idx on public.cuentas_tecnologia(creado_por);

create schema tecnologia_privada;
revoke all on schema tecnologia_privada from public, anon, authenticated;
grant usage on schema tecnologia_privada to service_role;

create table tecnologia_privada.credenciales (
  cuenta_id bigint primary key references public.cuentas_tecnologia(id) on delete cascade,
  ciphertext text not null,
  iv text not null,
  key_version integer not null check (key_version > 0),
  actualizado_en timestamptz not null default now()
);
create table tecnologia_privada.desbloqueos (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  sesion_id uuid not null,
  creado_en timestamptz not null default now()
);
create index tecnologia_desbloqueos_sesion on tecnologia_privada.desbloqueos(sesion_id);
create index tecnologia_desbloqueos_usuario on tecnologia_privada.desbloqueos(usuario_id);
create table tecnologia_privada.intentos (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  ventana timestamptz not null default now(),
  cantidad integer not null default 0
);
create table tecnologia_privada.auditoria (
  id bigint generated always as identity primary key,
  usuario_id uuid references auth.users(id) on delete set null,
  sesion_id uuid not null,
  cuenta_id bigint,
  accion text not null,
  creado_en timestamptz not null default now()
);
create index tecnologia_auditoria_usuario on tecnologia_privada.auditoria(usuario_id);
alter table tecnologia_privada.credenciales enable row level security;
alter table tecnologia_privada.desbloqueos enable row level security;
alter table tecnologia_privada.intentos enable row level security;
alter table tecnologia_privada.auditoria enable row level security;
revoke all on all tables in schema tecnologia_privada from public, anon, authenticated;
revoke all on all sequences in schema tecnologia_privada from public, anon, authenticated;

create function tecnologia_privada.revocar_al_cambiar_rol()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if old.rol='admin' and (tg_op='DELETE' or new.rol is distinct from 'admin') then
    delete from tecnologia_privada.desbloqueos where usuario_id=old.user_id;
  end if;
  return null;
end;
$$;
revoke all on function tecnologia_privada.revocar_al_cambiar_rol() from public,anon,authenticated;
create trigger tecnologia_revocar_desbloqueos after update of rol or delete on public.roles_usuario
for each row execute function tecnologia_privada.revocar_al_cambiar_rol();

-- An old frontend may edit normal fields, but cannot forge the secret flag or
-- delete a credential-bearing account without server authorization.
revoke insert, update on public.cuentas_tecnologia from authenticated;
grant insert(herramienta,plan,dia_renovacion,costo,moneda,correo,uso,fecha_renovacion)
  on public.cuentas_tecnologia to authenticated;
grant update(herramienta,plan,dia_renovacion,costo,moneda,correo,uso,fecha_renovacion)
  on public.cuentas_tecnologia to authenticated;
drop policy if exists "cuentas tecnologia: administracion admin" on public.cuentas_tecnologia;
create policy "cuentas tecnologia: insertar admin" on public.cuentas_tecnologia
  for insert to authenticated with check ((select public.tiene_rol(array['admin'])));
create policy "cuentas tecnologia: editar admin" on public.cuentas_tecnologia
  for update to authenticated using ((select public.tiene_rol(array['admin'])))
  with check ((select public.tiene_rol(array['admin'])));
create policy "cuentas tecnologia: eliminar sin credencial" on public.cuentas_tecnologia
  for delete to authenticated using ((select public.tiene_rol(array['admin'])) and not tiene_contrasena);

create function tecnologia_privada.operar(
  p_accion text, p_usuario uuid, p_sesion uuid,
  p_token_hash text default null, p_datos jsonb default '{}'
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_id bigint;
  v_cuenta public.cuentas_tecnologia%rowtype;
  v_secreto tecnologia_privada.credenciales%rowtype;
  v_cantidad integer;
  v_fecha date;
  v_nuevo boolean := coalesce((p_datos->>'nuevo')::boolean, false);
  v_modo text := coalesce(p_datos->>'credencial_accion', 'conservar');
  v_abierto boolean;
begin
  -- Identity is supplied only by the service-role gateway after Auth.getUser.
  -- Checking auth.sessions also rejects signed-out but unexpired access tokens.
  if p_usuario is null or p_sesion is null or not exists (
    select 1 from auth.sessions where id = p_sesion and user_id = p_usuario
      and (not_after is null or not_after > now())
  ) then raise exception 'SESION_INVALIDA' using errcode = '28000'; end if;
  if not exists (select 1 from public.roles_usuario where user_id = p_usuario and rol = 'admin')
    then raise exception 'SOLO_ADMIN' using errcode = '42501'; end if;

  v_abierto := exists (select 1 from tecnologia_privada.desbloqueos
    where token_hash = p_token_hash and usuario_id = p_usuario and sesion_id = p_sesion);

  if p_accion = 'validar' then return jsonb_build_object('ok', true); end if;
  if p_accion = 'reservar_intento' then
    insert into tecnologia_privada.intentos as i(usuario_id, ventana, cantidad) values(p_usuario, now(), 1)
    on conflict(usuario_id) do update set
      ventana = case when i.ventana < now() - interval '15 minutes' then now() else i.ventana end,
      cantidad = case when i.ventana < now() - interval '15 minutes' then 1 else i.cantidad + 1 end
    returning cantidad into v_cantidad;
    return jsonb_build_object('permitido', v_cantidad <= 5);
  end if;
  if p_accion = 'fallo_desbloqueo' then
    insert into tecnologia_privada.auditoria(usuario_id,sesion_id,accion) values(p_usuario,p_sesion,'desbloqueo_fallido');
    return jsonb_build_object('ok', true);
  end if;
  if p_accion = 'desbloquear' then
    if p_token_hash is null then raise exception 'DATOS_INVALIDOS' using errcode='22023'; end if;
    delete from tecnologia_privada.desbloqueos d where not exists (select 1 from auth.sessions s where s.id=d.sesion_id);
    insert into tecnologia_privada.desbloqueos(token_hash,usuario_id,sesion_id) values(p_token_hash,p_usuario,p_sesion);
    delete from tecnologia_privada.intentos where usuario_id=p_usuario;
    insert into tecnologia_privada.auditoria(usuario_id,sesion_id,accion) values(p_usuario,p_sesion,'desbloqueado');
    return jsonb_build_object('ok',true);
  end if;
  if p_accion = 'bloquear' then
    delete from tecnologia_privada.desbloqueos where token_hash=p_token_hash and usuario_id=p_usuario and sesion_id=p_sesion;
    return jsonb_build_object('ok',true);
  end if;
  if p_accion = 'siguiente_id' then
    return jsonb_build_object('id',nextval('public.cuentas_tecnologia_id_seq'));
  end if;

  v_id := (p_datos->>'id')::bigint;
  if v_id is null or v_id <= 0 then raise exception 'DATOS_INVALIDOS' using errcode='22023'; end if;
  if not v_nuevo then
    select * into v_cuenta from public.cuentas_tecnologia where id=v_id for update;
    if not found then raise exception 'CUENTA_NO_ENCONTRADA' using errcode='P0002'; end if;
  end if;

  if p_accion = 'revelar' then
    if not v_abierto then raise exception 'BOVEDA_BLOQUEADA' using errcode='42501'; end if;
    select * into v_secreto from tecnologia_privada.credenciales where cuenta_id=v_id;
    if not found then raise exception 'SIN_CREDENCIAL' using errcode='P0002'; end if;
    insert into tecnologia_privada.auditoria(usuario_id,sesion_id,cuenta_id,accion)
      values(p_usuario,p_sesion,v_id,case when p_datos->>'motivo'='copiar' then 'credencial_copiada' else 'credencial_revelada' end);
    return jsonb_build_object('ciphertext',v_secreto.ciphertext,'iv',v_secreto.iv,'key_version',v_secreto.key_version);
  end if;
  if p_accion = 'eliminar' then
    if v_cuenta.tiene_contrasena and not v_abierto then raise exception 'BOVEDA_BLOQUEADA' using errcode='42501'; end if;
    delete from public.cuentas_tecnologia where id=v_id;
    insert into tecnologia_privada.auditoria(usuario_id,sesion_id,cuenta_id,accion) values(p_usuario,p_sesion,v_id,'cuenta_eliminada');
    return jsonb_build_object('ok',true);
  end if;
  if p_accion <> 'guardar' then raise exception 'ACCION_INVALIDA' using errcode='22023'; end if;
  if v_modo not in ('conservar','guardar','eliminar') then raise exception 'DATOS_INVALIDOS' using errcode='22023'; end if;
  if v_modo <> 'conservar' and not v_abierto then raise exception 'BOVEDA_BLOQUEADA' using errcode='42501'; end if;
  v_fecha := nullif(p_datos->>'fecha_renovacion','')::date;
  if btrim(coalesce(p_datos->>'herramienta',''))='' or btrim(coalesce(p_datos->>'plan',''))=''
    or (v_nuevo and (v_fecha is null or btrim(coalesce(p_datos->>'correo',''))='' or btrim(coalesce(p_datos->>'uso',''))=''))
    then raise exception 'DATOS_INVALIDOS' using errcode='22023'; end if;

  if v_nuevo then
    insert into public.cuentas_tecnologia(id,herramienta,plan,dia_renovacion,costo,moneda,creado_por,correo,uso,fecha_renovacion)
    values(v_id,btrim(p_datos->>'herramienta'),btrim(p_datos->>'plan'),extract(day from v_fecha)::smallint,
      nullif(p_datos->>'costo','')::numeric,coalesce(p_datos->>'moneda','COP'),p_usuario,
      btrim(p_datos->>'correo'),btrim(p_datos->>'uso'),v_fecha);
  else
    update public.cuentas_tecnologia set herramienta=btrim(p_datos->>'herramienta'),plan=btrim(p_datos->>'plan'),
      dia_renovacion=coalesce(extract(day from v_fecha)::smallint,dia_renovacion),
      costo=nullif(p_datos->>'costo','')::numeric,moneda=coalesce(p_datos->>'moneda','COP'),
      correo=btrim(coalesce(p_datos->>'correo','')),uso=btrim(coalesce(p_datos->>'uso','')),fecha_renovacion=v_fecha
    where id=v_id;
  end if;
  if v_modo='guardar' then
    if coalesce(p_datos->>'ciphertext','')='' or coalesce(p_datos->>'iv','')='' or (p_datos->>'key_version')::int <> 1
      then raise exception 'DATOS_INVALIDOS' using errcode='22023'; end if;
    insert into tecnologia_privada.credenciales(cuenta_id,ciphertext,iv,key_version)
      values(v_id,p_datos->>'ciphertext',p_datos->>'iv',(p_datos->>'key_version')::int)
      on conflict(cuenta_id) do update set ciphertext=excluded.ciphertext,iv=excluded.iv,key_version=excluded.key_version,actualizado_en=now();
  elsif v_modo='eliminar' then delete from tecnologia_privada.credenciales where cuenta_id=v_id;
  end if;
  update public.cuentas_tecnologia set tiene_contrasena=exists(
    select 1 from tecnologia_privada.credenciales where cuenta_id=v_id) where id=v_id;
  insert into tecnologia_privada.auditoria(usuario_id,sesion_id,cuenta_id,accion)
    values(p_usuario,p_sesion,v_id,case v_modo when 'guardar' then 'credencial_guardada' when 'eliminar' then 'credencial_eliminada' else 'cuenta_guardada' end);
  return jsonb_build_object('id',v_id);
end;
$$;
revoke all on function tecnologia_privada.operar(text,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function tecnologia_privada.operar(text,uuid,uuid,text,jsonb) to service_role;

-- Exposed bridge is SECURITY INVOKER and service-role-only. All privileged
-- implementation and auth.sessions access remain in the non-exposed schema.
create function public.tecnologia_operar(p_accion text,p_usuario uuid,p_sesion uuid,p_token_hash text default null,p_datos jsonb default '{}')
returns jsonb language sql security invoker set search_path='' as $$
  select tecnologia_privada.operar(p_accion,p_usuario,p_sesion,p_token_hash,p_datos);
$$;
revoke all on function public.tecnologia_operar(text,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.tecnologia_operar(text,uuid,uuid,text,jsonb) to service_role;
notify pgrst,'reload schema';
commit;
