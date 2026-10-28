-- Additive payment tracking. No historical payments are inferred.
begin;
alter table public.cuentas_tecnologia
  add column periodicidad text not null default 'mensual' check (periodicidad in ('mensual','anual')),
  add column pago_version bigint not null default 0,
  add column pago_deshacer_hasta timestamptz,
  add column ultimo_pago_id uuid,
  add column ultimo_pago_en timestamptz,
  add column ultimo_pago_por uuid references auth.users(id) on delete set null;

create table public.pagos_tecnologia (
  operacion_id uuid primary key,
  cuenta_id bigint not null references public.cuentas_tecnologia(id) on delete cascade,
  tipo text not null check(tipo in ('pago','deshacer')),
  usuario_id uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now(),
  revierte_id uuid references public.pagos_tecnologia(operacion_id),
  fecha_anterior date,
  fecha_nueva date,
  dia_anterior smallint not null,
  pago_anterior_id uuid,
  pago_anterior_en timestamptz,
  pago_anterior_por uuid,
  version_resultado bigint not null
);
create index cuentas_tecnologia_ultimo_pago_por_idx on public.cuentas_tecnologia(ultimo_pago_por);
create index pagos_tecnologia_usuario_idx on public.pagos_tecnologia(usuario_id);
create index pagos_tecnologia_revierte_idx on public.pagos_tecnologia(revierte_id);
create index pagos_tecnologia_cuenta_idx on public.pagos_tecnologia(cuenta_id,creado_en desc);
alter table public.pagos_tecnologia enable row level security;
revoke all on public.pagos_tecnologia from public,anon,authenticated;
grant select on public.pagos_tecnologia to authenticated;
create policy "pagos tecnologia: lectura admin" on public.pagos_tecnologia
  for select to authenticated using ((select public.tiene_rol(array['admin'])));

-- Runs for legacy direct edits as well as the gateway. Protected summary columns
-- have no authenticated UPDATE grant. A new payment ID identifies trusted writes.
create function tecnologia_privada.invalidar_pago_editado()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.fecha_renovacion is distinct from old.fecha_renovacion
    or new.dia_renovacion is distinct from old.dia_renovacion
    or new.periodicidad is distinct from old.periodicidad
    or new.ultimo_pago_id is distinct from old.ultimo_pago_id then
    new.pago_version := old.pago_version + 1;
    if new.ultimo_pago_id is not distinct from old.ultimo_pago_id then
      new.ultimo_pago_id := null; new.ultimo_pago_en := null; new.ultimo_pago_por := null; new.pago_deshacer_hasta := null;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function tecnologia_privada.invalidar_pago_editado() from public,anon,authenticated;
create trigger tecnologia_invalidar_pago before update on public.cuentas_tecnologia
  for each row execute function tecnologia_privada.invalidar_pago_editado();

create or replace function tecnologia_privada.operar_cuentas_base(
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
      nullif(p_datos->>'costo','')::numeric,coalesce(p_datos->>'moneda','MXN'),p_usuario,
      btrim(p_datos->>'correo'),btrim(p_datos->>'uso'),v_fecha);
  else
    update public.cuentas_tecnologia set herramienta=btrim(p_datos->>'herramienta'),plan=btrim(p_datos->>'plan'),
      dia_renovacion=case when v_fecha is distinct from v_cuenta.fecha_renovacion then coalesce(extract(day from v_fecha)::smallint,dia_renovacion) else dia_renovacion end,
      costo=nullif(p_datos->>'costo','')::numeric,moneda=coalesce(p_datos->>'moneda','MXN'),
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

revoke all on function tecnologia_privada.operar_cuentas_base(text,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function tecnologia_privada.operar_cuentas_base(text,uuid,uuid,text,jsonb) to service_role;

create or replace function tecnologia_privada.operar(
 p_accion text,p_usuario uuid,p_sesion uuid,p_token_hash text default null,p_datos jsonb default '{}'
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 c public.cuentas_tecnologia%rowtype;
 e public.pagos_tecnologia%rowtype;
 previous public.pagos_tecnologia%rowtype;
 result jsonb;
 operation uuid;
 next_date date;
 target_month date;
 today date := (now() at time zone 'America/Bogota')::date;
 next_day smallint;
 version_after bigint;
begin
 -- Reuse the existing live-session and database-role checks, including on retries.
 perform tecnologia_privada.operar_cuentas_base('validar',p_usuario,p_sesion,p_token_hash,'{}');
 if p_accion not in ('registrar_pago','deshacer_pago') then
   if p_accion='guardar' and p_datos ? 'periodicidad' and coalesce(p_datos->>'periodicidad','') not in ('mensual','anual') then
     raise exception 'DATOS_INVALIDOS';
   end if;
   result := tecnologia_privada.operar_cuentas_base(p_accion,p_usuario,p_sesion,p_token_hash,p_datos);
   if p_accion='guardar' and p_datos ? 'periodicidad' then
     update public.cuentas_tecnologia set periodicidad=p_datos->>'periodicidad' where id=(result->>'id')::bigint;
   end if;
   return result;
 end if;
 select * into c from public.cuentas_tecnologia where id=(p_datos->>'id')::bigint for update;
 if not found then raise exception 'CUENTA_NO_ENCONTRADA'; end if;
 operation := (p_datos->>'operacion_id')::uuid;
 if operation is null or p_datos->>'version' is null then raise exception 'DATOS_INVALIDOS'; end if;
 select * into e from public.pagos_tecnologia where operacion_id=operation;
 if found then
   if e.cuenta_id<>c.id or e.usuario_id is distinct from p_usuario or e.tipo<>(case when p_accion='registrar_pago' then 'pago' else 'deshacer' end) then
     raise exception 'CONFLICTO_PAGO';
   end if;
   return jsonb_build_object('ok',true,'operacion_id',operation);
 end if;
 if c.pago_version<>(p_datos->>'version')::bigint then raise exception 'CONFLICTO_PAGO'; end if;
 if p_accion='registrar_pago' then
   if nullif(p_datos->>'fecha_renovacion','') is not null then
     next_date := (p_datos->>'fecha_renovacion')::date;
     next_day := extract(day from next_date)::smallint;
   else
     if c.fecha_renovacion is null then raise exception 'FECHA_REQUERIDA'; end if;
     target_month := (date_trunc('month',c.fecha_renovacion) + case when c.periodicidad='anual' then interval '1 year' else interval '1 month' end)::date;
     next_date := target_month + (least(c.dia_renovacion,extract(day from target_month+interval '1 month - 1 day')::integer)-1);
     next_day := c.dia_renovacion;
   end if;
   if next_date<=today or (c.fecha_renovacion is not null and next_date<=c.fecha_renovacion) then raise exception 'FECHA_REQUERIDA'; end if;
   update public.cuentas_tecnologia set fecha_renovacion=next_date,dia_renovacion=next_day,
     pago_deshacer_hasta=now()+interval '10 minutes',ultimo_pago_id=operation,ultimo_pago_en=now(),ultimo_pago_por=p_usuario where id=c.id
     returning pago_version into version_after;
 else
   select * into previous from public.pagos_tecnologia where operacion_id=c.ultimo_pago_id and tipo='pago';
   if not found or previous.operacion_id is distinct from (p_datos->>'pago_id')::uuid
     or previous.version_resultado<>c.pago_version or previous.creado_en<=now()-interval '10 minutes'
     or exists(select 1 from public.pagos_tecnologia where revierte_id=previous.operacion_id)
   then raise exception 'DESHACER_NO_DISPONIBLE'; end if;
   next_date := previous.fecha_anterior;
   update public.cuentas_tecnologia set fecha_renovacion=next_date,dia_renovacion=previous.dia_anterior,
     pago_deshacer_hasta=null,ultimo_pago_id=previous.pago_anterior_id,ultimo_pago_en=previous.pago_anterior_en,ultimo_pago_por=previous.pago_anterior_por
     where id=c.id returning pago_version into version_after;
 end if;
 insert into public.pagos_tecnologia(operacion_id,cuenta_id,tipo,usuario_id,revierte_id,fecha_anterior,fecha_nueva,dia_anterior,
   pago_anterior_id,pago_anterior_en,pago_anterior_por,version_resultado)
 values(operation,c.id,case when p_accion='registrar_pago' then 'pago' else 'deshacer' end,p_usuario,
   case when p_accion='deshacer_pago' then previous.operacion_id end,c.fecha_renovacion,next_date,c.dia_renovacion,
   c.ultimo_pago_id,c.ultimo_pago_en,c.ultimo_pago_por,version_after);
 return jsonb_build_object('ok',true,'operacion_id',operation);
end;
$$;
revoke all on function tecnologia_privada.operar(text,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function tecnologia_privada.operar(text,uuid,uuid,text,jsonb) to service_role;
notify pgrst,'reload schema';
commit;
