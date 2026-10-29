-- Additive company introduction. Existing prose and links are never rewritten.
begin;
alter table public.radar_prospectos
  add column ciudad text,
  add column pais text,
  add column paises_operacion text,
  add column tipo_sitio_web text not null default 'sin_definir' check (tipo_sitio_web in ('sin_definir','web','linkedin')),
  add column linkedin_empresa text,
  add column que_hace text,
  add column como_opera text,
  add column tamano_estructura text,
  add column senal_fecha date,
  add column senal_fuente text,
  add column servicio_principal text,
  add column pendientes_validar text,
  add column investigado_el date,
  add column contactos jsonb not null default '[]'::jsonb check (jsonb_typeof(contactos)='array'),
  add column evidencias jsonb not null default '[]'::jsonb check (jsonb_typeof(evidencias)='array');

-- An UPDATE holds the row lock: if selection wins the race, OLD is already
-- selected here and the edit is rejected. Workflow-only updates are untouched.
create function radar_privado.validar_ficha() returns trigger
language plpgsql security invoker set search_path='' as $$
declare v_item jsonb; v_url text; v_campo text; v_cambio boolean;
begin
 if tg_op='UPDATE' then
  if old.estado not in ('candidato','no_elegido') and (new.estado in ('candidato','no_elegido') or new.fecha_lista is distinct from old.fecha_lista) then
   raise exception 'Un prospecto elegido no puede volver a candidato ni cambiar de lista.' using errcode='42501';
  end if;
  if new.fecha_lista is distinct from old.fecha_lista and not public.radar_puede_paso(1)
    and not (public.radar_puede_paso(2) and old.estado='no_elegido' and new.estado='candidato') then
   raise exception 'Solo el paso 1 puede cambiar la lista, salvo al recuperar un no elegido.' using errcode='42501';
  end if;
  v_cambio := (to_jsonb(new) - array['estado','fecha_lista','enfoque_servicio','enfoque_angulo','enfoque_cuidar','fecha_envio','crm_url','rondas'])
    is distinct from (to_jsonb(old) - array['estado','fecha_lista','enfoque_servicio','enfoque_angulo','enfoque_cuidar','fecha_envio','crm_url','rondas']);
  if not v_cambio then return new; end if;
  if not public.radar_puede_paso(1) or old.estado not in ('candidato','no_elegido') or new.estado not in ('candidato','no_elegido') then
   raise exception 'La ficha solo puede editarse antes de elegir y con permiso del paso 1.' using errcode='42501';
  end if;
  if new.id is distinct from old.id or new.creado_por is distinct from old.creado_por or new.creado_en is distinct from old.creado_en then
   raise exception 'No se pueden modificar los datos de creación de la ficha.' using errcode='42501';
  end if;
 end if;
 if coalesce(trim(new.empresa),'')='' then raise exception 'Completa la empresa.'; end if;
 -- Required introduction fields are enforced by the new form. Nullable storage
 -- preserves historical records and supports the previous frontend on rollback.
 if new.score < 0 then raise exception 'El score debe ser positivo o cero.'; end if;
 foreach v_campo in array array['sitio_web','linkedin_empresa','senal_fuente'] loop
  v_url := to_jsonb(new)->>v_campo;
  -- Do not invalidate an unchanged historical link during partial editing.
  if tg_op='UPDATE' and v_campo='sitio_web' and v_url is not distinct from old.sitio_web then continue; end if;
  if coalesce(v_url,'')<>'' and v_url !~* '^https?://[^[:space:]/?#]+[^[:space:]]*$' then raise exception 'Los enlaces deben ser HTTP/HTTPS.'; end if;
 end loop;
 if jsonb_typeof(new.contactos) is distinct from 'array' or jsonb_typeof(new.evidencias) is distinct from 'array' then raise exception 'Contactos y evidencias deben ser listas.'; end if;
 for v_item in select value from jsonb_array_elements(new.contactos) loop
  if jsonb_typeof(v_item)<>'object' or coalesce(trim(v_item->>'nombre'),'')='' or coalesce(v_item->>'estado','') not in ('por_validar','con_fuente') then raise exception 'Completa nombre y estado de cada contacto.'; end if;
  if coalesce(v_item->>'linkedin','')<>'' and (v_item->>'linkedin') !~* '^https?://[^[:space:]/?#]+[^[:space:]]*$' then raise exception 'El enlace del contacto debe ser HTTP/HTTPS.'; end if;
 end loop;
 for v_item in select value from jsonb_array_elements(new.evidencias) loop
  if jsonb_typeof(v_item)<>'object' or coalesce(trim(v_item->>'nombre'),'')='' or coalesce(v_item->>'bloque','') not in ('identificacion','entendimiento','tamano','senal','servicios','contactos') or coalesce(v_item->>'estado','') not in ('con_fuente','estimacion','por_validar') then raise exception 'Completa bloque, nombre y estado de cada evidencia.'; end if;
  if coalesce(v_item->>'enlace','')<>'' and (v_item->>'enlace') !~* '^https?://[^[:space:]/?#]+[^[:space:]]*$' then raise exception 'El enlace de la evidencia debe ser HTTP/HTTPS.'; end if;
  if v_item->>'estado'='con_fuente' and (coalesce(v_item->>'enlace','')='' or coalesce(v_item->>'fecha_consulta','')='') then raise exception 'Un dato con fuente necesita enlace y fecha de consulta.'; end if;
  if coalesce(v_item->>'fecha_consulta','')<>'' then perform (v_item->>'fecha_consulta')::date; end if;
 end loop;
 return new;
end; $$;
revoke all on function radar_privado.validar_ficha() from public,anon,authenticated;
create trigger radar_validar_ficha before insert or update on public.radar_prospectos
for each row execute function radar_privado.validar_ficha();
notify pgrst,'reload schema';
commit;
