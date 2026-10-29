-- Radar comercial: un solo prospecto elegido por lista corta.
--
-- Cada viernes se publican 3 a 5 candidatos y se elige uno. Al elegirlo, la
-- lista se cierra: el resto de sus candidatos pasa a 'no_elegido' y ya no se
-- puede elegir otro de esa misma lista. Un no elegido puede volver a publicarse
-- en una lista nueva con "Recuperar".

create or replace function public.radar_elegir(p_prospecto bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prospecto public.radar_prospectos;
  v_elegido text;
begin
  if not public.radar_puede_paso(2) then
    raise exception 'No tienes asignado el paso 2 (elegir el prospecto).';
  end if;

  select * into v_prospecto from public.radar_prospectos where id = p_prospecto;
  if not found then
    raise exception 'El prospecto no existe.';
  end if;

  -- Bloquea la lista completa para que dos personas no elijan a la vez.
  perform 1 from public.radar_prospectos where fecha_lista = v_prospecto.fecha_lista for update;

  select * into v_prospecto from public.radar_prospectos where id = p_prospecto;
  if v_prospecto.estado not in ('candidato', 'no_elegido') then
    raise exception 'Este prospecto ya fue elegido.';
  end if;

  select empresa into v_elegido
  from public.radar_prospectos
  where fecha_lista = v_prospecto.fecha_lista
    and id <> p_prospecto
    and estado not in ('candidato', 'no_elegido')
  limit 1;
  if v_elegido is not null then
    raise exception 'La lista del % ya está cerrada: se eligió %.', to_char(v_prospecto.fecha_lista, 'DD/MM/YYYY'), v_elegido;
  end if;

  update public.radar_prospectos set estado = 'en_curso' where id = p_prospecto;

  -- Cierra la lista: el resto de sus candidatos queda como no elegido.
  update public.radar_prospectos
  set estado = 'no_elegido'
  where fecha_lista = v_prospecto.fecha_lista and id <> p_prospecto and estado = 'candidato';

  insert into public.radar_hitos (prospecto_id, paso, fecha_compromiso)
  select p_prospecto, paso, public.radar_sumar_habiles(v_prospecto.fecha_lista, desfase)
  from public.radar_pasos;

  update public.radar_hitos
  set fecha_real = v_prospecto.creado_en::date, completado_por = v_prospecto.creado_por
  where prospecto_id = p_prospecto and paso = 1;

  update public.radar_hitos
  set fecha_real = current_date, completado_por = auth.uid()
  where prospecto_id = p_prospecto and paso = 2;
end;
$$;

-- Listas que ya tienen un elegido: sus candidatos restantes quedan cerrados.
update public.radar_prospectos c
set estado = 'no_elegido'
where c.estado = 'candidato'
  and exists (
    select 1 from public.radar_prospectos e
    where e.fecha_lista = c.fecha_lista
      and e.id <> c.id
      and e.estado not in ('candidato', 'no_elegido')
  );
