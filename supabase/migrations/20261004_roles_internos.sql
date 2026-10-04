-- Roles internos: cada persona del equipo con su cuenta y acceso por rol.
--
--   admin         todo
--   comercial     dictámenes (crear, emitir, reemplazar), enviar correo, E360 Comunica
--   comunicacion  E360 Comunica
--   auditor       dictámenes en solo lectura, servidor EC2
--   cliente       sin cambios
--
-- Para admin y cliente el comportamiento queda igual que antes. De paso se
-- cierran las políticas abiertas a anónimos de clientes y codigos_registro.

-- ---------------------------------------------------------------------------
-- 1. Roles admitidos
-- ---------------------------------------------------------------------------
alter table public.roles_usuario drop constraint roles_usuario_rol_check;
alter table public.roles_usuario add constraint roles_usuario_rol_check
  check (rol = any (array['admin', 'cliente', 'comercial', 'comunicacion', 'auditor']));

-- ---------------------------------------------------------------------------
-- 2. Comprobación de rol reutilizable por todas las políticas
--
-- security definer para leer roles_usuario sin depender de sus propias
-- políticas. Solo responde sobre el usuario que hace la petición.
-- ---------------------------------------------------------------------------
create or replace function public.tiene_rol(roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.roles_usuario
    where user_id = auth.uid() and rol = any (roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Dictámenes: tabla documentos
-- ---------------------------------------------------------------------------
alter policy documentos_select_admin on public.documentos
  using (public.tiene_rol(array['admin', 'comercial', 'auditor']));

alter policy documentos_insert_admin on public.documentos
  with check (public.tiene_rol(array['admin', 'comercial']));

alter policy documentos_update_admin_borrador on public.documentos
  using (estado = 'borrador'::documento_estado and public.tiene_rol(array['admin', 'comercial']));

alter policy documentos_update_admin_emitido on public.documentos
  using (estado = 'emitido'::documento_estado and public.tiene_rol(array['admin', 'comercial']))
  with check (estado = 'emitido'::documento_estado and public.tiene_rol(array['admin', 'comercial']));

alter policy documentos_delete_admin_borrador on public.documentos
  using (estado = 'borrador'::documento_estado and public.tiene_rol(array['admin', 'comercial']));

-- Comparaba el id del cliente con el id del usuario: nunca coincidía.
-- "Clients can view their emitted documents" ya cubre ese caso.
drop policy documentos_select_propietario on public.documentos;

-- ---------------------------------------------------------------------------
-- 4. Clientes y bitácora
-- ---------------------------------------------------------------------------
alter policy "Admins can view all clients" on public.clientes
  using (public.tiene_rol(array['admin', 'comercial', 'auditor']));

-- Estaba abierta a cualquiera, también sin sesión. Los clientes se crean con
-- registrar_cliente_con_codigo, que es security definer y no la necesita.
drop policy "Allow insert to clientes from function" on public.clientes;

alter policy bitacora_select_admin on public.bitacora_documentos
  using (public.tiene_rol(array['admin', 'comercial', 'auditor']));

-- ---------------------------------------------------------------------------
-- 5. Códigos de registro
--
-- Cualquiera podía leerlos y modificarlos sin sesión. Solo los usa
-- registrar_cliente_con_codigo (security definer), así que basta con RLS
-- activo y sin políticas.
-- ---------------------------------------------------------------------------
drop policy "Allow select for RPC" on public.codigos_registro;
drop policy "Allow update for RPC" on public.codigos_registro;
drop policy "Allow update to codigos_registro" on public.codigos_registro;

-- ---------------------------------------------------------------------------
-- 6. E360 Comunica
-- ---------------------------------------------------------------------------
alter policy "articulos: administracion completa" on public.articulos
  using (public.tiene_rol(array['admin', 'comercial', 'comunicacion']))
  with check (public.tiene_rol(array['admin', 'comercial', 'comunicacion']));

alter policy "portadas: escritura de administradores" on storage.objects
  using (bucket_id = 'articulos_publicos' and public.tiene_rol(array['admin', 'comercial', 'comunicacion']))
  with check (bucket_id = 'articulos_publicos' and public.tiene_rol(array['admin', 'comercial', 'comunicacion']));

-- ---------------------------------------------------------------------------
-- 7. PDFs de dictámenes (bucket documentos_privados)
--
-- Las políticas "Admin: acceso total hkirna_*" siguen igual, solo para admin.
-- ---------------------------------------------------------------------------
create policy "documentos_privados: lectura interna" on storage.objects
  for select to authenticated
  using (bucket_id = 'documentos_privados' and public.tiene_rol(array['comercial', 'auditor']));

create policy "documentos_privados: escritura comercial" on storage.objects
  for all to authenticated
  using (bucket_id = 'documentos_privados' and public.tiene_rol(array['comercial']))
  with check (bucket_id = 'documentos_privados' and public.tiene_rol(array['comercial']));

-- Redundante con "Admin: acceso total hkirna_2".
drop policy "Admin puede subir PDF hkirna_0" on storage.objects;
-- Misma comparación incorrecta que documentos_select_propietario.
-- "Cliente puede leer su PDF emitido" ya cubre ese caso.
drop policy "Cliente puede leer su PDF emitido hkirna_0" on storage.objects;

-- ---------------------------------------------------------------------------
-- 8. Emisión de dictámenes: también comercial
-- ---------------------------------------------------------------------------
create or replace function public.emitir_documento(p_documento_id bigint, p_hash_documento text)
returns void
language plpgsql
security definer
as $function$
declare
    v_estado_actual public.documento_estado;
begin
    -- 1. Validar rol
    if not public.tiene_rol(array['admin', 'comercial']) then
        raise exception 'Permiso denegado: solo administración o comercial pueden emitir documentos';
    end if;

    -- 2. Obtener y validar estado actual del documento
    select estado
    into v_estado_actual
    from public.documentos
    where id = p_documento_id
    for update;

    if not found then
        raise exception 'Documento no existe';
    end if;

    if v_estado_actual <> 'borrador' then
        raise exception 'Solo se pueden emitir documentos en estado borrador';
    end if;

    -- 3. Validar existencia de PDF
    if not exists (
        select 1
        from public.documentos
        where id = p_documento_id
          and ruta_storage_pdf is not null
    ) then
        raise exception 'No se puede emitir un documento sin PDF asociado';
    end if;

    -- 4. Sellar documento (INMUTABLE A PARTIR DE AQUÍ)
    update public.documentos
    set
        estado = 'emitido',
        hash_documento = p_hash_documento,
        fecha_emision = now(),
        emitido_por = auth.uid()
    where id = p_documento_id;

    -- 5. Registrar evento en bitácora (append-only)
    insert into public.bitacora_documentos (
        id_documento,
        actor,
        accion,
        detalles
    ) values (
        p_documento_id,
        auth.uid(),
        'EMISION',
        jsonb_build_object(
            'hash_documento', p_hash_documento
        )
    );
end;
$function$;
