-- Radar comercial (Centro de conocimiento)
--
-- Seguimiento de cada prospecto por los 9 pasos del flujo comercial.
--
--   radar_accesos      quién entra al Radar y qué pasos puede cerrar
--   radar_pasos        el flujo definido (lo lee la página "Flujo")
--   radar_prospectos   candidatos de la lista corta y prospectos en curso
--   radar_hitos        un registro por prospecto y paso: fecha compromiso y real
--   radar_comentarios  comentarios, observaciones y vistos buenos
--   radar_archivos     archivos subidos al bucket privado "radar"
--
-- Entrar al Radar no depende del rol: solo quien está en radar_accesos.
-- El rol admin administra la lista de accesos.
-- Los pasos se cierran solo con radar_completar_paso, que valida permisos,
-- orden y entregables.

-- ---------------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------------
create table public.radar_accesos (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  nombre    text not null,
  pasos     int[] not null default '{}',
  creado_en timestamptz not null default now()
);

create table public.radar_pasos (
  paso        int primary key,
  nombre      text not null,
  responsable text not null,
  dia         text not null,
  desfase     int not null,  -- días hábiles desde el viernes de la lista corta
  entregable  text not null,
  como        text not null default ''
);

create table public.radar_prospectos (
  id               bigint generated always as identity primary key,
  empresa          text not null,
  score            int,
  senal            text,
  por_que_ahora    text,
  servicios        text,
  estado           text not null default 'candidato'
                   check (estado in ('candidato', 'no_elegido', 'en_curso', 'enviado', 'en_seguimiento', 'descartado')),
  fecha_lista      date not null,
  enfoque_servicio text,
  enfoque_angulo   text,
  enfoque_cuidar   text,
  fecha_envio      date,
  crm_url          text,
  rondas           int not null default 0,
  creado_por       uuid default auth.uid() references auth.users (id),
  creado_en        timestamptz not null default now()
);

create table public.radar_hitos (
  prospecto_id     bigint not null references public.radar_prospectos (id) on delete cascade,
  paso             int not null references public.radar_pasos (paso),
  fecha_compromiso date not null,
  fecha_real       date,
  completado_por   uuid references auth.users (id),
  primary key (prospecto_id, paso)
);

create table public.radar_comentarios (
  id           bigint generated always as identity primary key,
  prospecto_id bigint not null references public.radar_prospectos (id) on delete cascade,
  paso         int not null references public.radar_pasos (paso),
  tipo         text not null default 'comentario'
               check (tipo in ('comentario', 'observacion', 'visto_bueno')),
  texto        text not null,
  autor        uuid not null default auth.uid() references auth.users (id),
  creado_en    timestamptz not null default now()
);

create table public.radar_archivos (
  id           bigint generated always as identity primary key,
  prospecto_id bigint not null references public.radar_prospectos (id) on delete cascade,
  paso         int not null references public.radar_pasos (paso),
  tipo         text not null,
  nombre       text not null,
  ruta         text not null unique,
  version      int not null default 1,
  subido_por   uuid not null default auth.uid() references auth.users (id),
  subido_en    timestamptz not null default now()
);

create index radar_comentarios_prospecto_idx on public.radar_comentarios (prospecto_id);
create index radar_archivos_prospecto_idx on public.radar_archivos (prospecto_id);

-- ---------------------------------------------------------------------------
-- 2. Comprobaciones de acceso (security definer, como tiene_rol)
-- ---------------------------------------------------------------------------
create or replace function public.radar_tiene_acceso()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.radar_accesos where user_id = auth.uid());
$$;

create or replace function public.radar_puede_paso(p_paso int)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.radar_accesos
    where user_id = auth.uid() and p_paso = any (pasos)
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Políticas
-- ---------------------------------------------------------------------------
alter table public.radar_accesos enable row level security;
alter table public.radar_pasos enable row level security;
alter table public.radar_prospectos enable row level security;
alter table public.radar_hitos enable row level security;
alter table public.radar_comentarios enable row level security;
alter table public.radar_archivos enable row level security;

create policy "radar_accesos: lectura" on public.radar_accesos
  for select to authenticated
  using (public.radar_tiene_acceso() or public.tiene_rol(array['admin']));
create policy "radar_accesos: administracion" on public.radar_accesos
  for all to authenticated
  using (public.tiene_rol(array['admin']))
  with check (public.tiene_rol(array['admin']));

create policy "radar_pasos: lectura" on public.radar_pasos
  for select to authenticated using (public.radar_tiene_acceso());
create policy "radar_pasos: edicion admin" on public.radar_pasos
  for update to authenticated
  using (public.tiene_rol(array['admin']) and public.radar_tiene_acceso())
  with check (public.tiene_rol(array['admin']) and public.radar_tiene_acceso());

create policy "radar_prospectos: lectura" on public.radar_prospectos
  for select to authenticated using (public.radar_tiene_acceso());
create policy "radar_prospectos: alta de candidatos" on public.radar_prospectos
  for insert to authenticated
  with check (public.radar_puede_paso(1) and estado = 'candidato');
create policy "radar_prospectos: edicion" on public.radar_prospectos
  for update to authenticated
  using (public.radar_tiene_acceso())
  with check (public.radar_tiene_acceso());
create policy "radar_prospectos: borrar candidatos" on public.radar_prospectos
  for delete to authenticated
  using (estado in ('candidato', 'no_elegido') and public.radar_puede_paso(1));

-- Los hitos solo cambian con las funciones de abajo, salvo la fecha
-- compromiso, que el admin puede mover (festivos, imprevistos).
create policy "radar_hitos: lectura" on public.radar_hitos
  for select to authenticated using (public.radar_tiene_acceso());
create policy "radar_hitos: fechas admin" on public.radar_hitos
  for update to authenticated
  using (public.tiene_rol(array['admin']) and public.radar_tiene_acceso())
  with check (public.tiene_rol(array['admin']) and public.radar_tiene_acceso());

create policy "radar_comentarios: lectura" on public.radar_comentarios
  for select to authenticated using (public.radar_tiene_acceso());
create policy "radar_comentarios: escritura" on public.radar_comentarios
  for insert to authenticated
  with check (public.radar_tiene_acceso() and autor = auth.uid() and tipo = 'comentario');

create policy "radar_archivos: lectura" on public.radar_archivos
  for select to authenticated using (public.radar_tiene_acceso());
create policy "radar_archivos: alta" on public.radar_archivos
  for insert to authenticated
  with check (public.radar_tiene_acceso() and subido_por = auth.uid());
create policy "radar_archivos: borrar admin" on public.radar_archivos
  for delete to authenticated
  using (public.tiene_rol(array['admin']) and public.radar_tiene_acceso());

-- ---------------------------------------------------------------------------
-- 4. Bucket privado "radar"
--
-- Rutas: <prospecto>/<paso>/<marca de tiempo>_<archivo>. Nada se reemplaza:
-- cada corrección es un archivo nuevo con su versión.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('radar', 'radar', false, 52428800)
on conflict (id) do nothing;

create policy "radar: lectura" on storage.objects
  for select to authenticated
  using (bucket_id = 'radar' and public.radar_tiene_acceso());
create policy "radar: subida" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'radar' and public.radar_tiene_acceso());
create policy "radar: borrar admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'radar' and public.tiene_rol(array['admin']) and public.radar_tiene_acceso());

-- ---------------------------------------------------------------------------
-- 5. Funciones del flujo
-- ---------------------------------------------------------------------------

-- Suma días hábiles (lunes a viernes) a una fecha.
create or replace function public.radar_sumar_habiles(p_fecha date, p_dias int)
returns date
language plpgsql
immutable
as $$
declare
  v_fecha date := p_fecha;
  v_resto int := p_dias;
begin
  while v_resto > 0 loop
    v_fecha := v_fecha + 1;
    if extract(isodow from v_fecha) < 6 then
      v_resto := v_resto - 1;
    end if;
  end loop;
  return v_fecha;
end;
$$;

-- Paso 2: elegir un candidato. Crea sus 9 hitos con fecha compromiso y deja
-- cerrados los pasos 1 y 2.
create or replace function public.radar_elegir(p_prospecto bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prospecto public.radar_prospectos;
begin
  if not public.radar_puede_paso(2) then
    raise exception 'No tienes asignado el paso 2 (elegir el prospecto).';
  end if;

  select * into v_prospecto from public.radar_prospectos where id = p_prospecto for update;
  if not found then
    raise exception 'El prospecto no existe.';
  end if;
  if v_prospecto.estado not in ('candidato', 'no_elegido') then
    raise exception 'Este prospecto ya fue elegido.';
  end if;

  update public.radar_prospectos set estado = 'en_curso' where id = p_prospecto;

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

-- Cierra un paso. Valida que la persona lo tenga asignado, que el paso
-- anterior esté cerrado y que el entregable exista.
create or replace function public.radar_completar_paso(p_prospecto bigint, p_paso int, p_texto text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prospecto public.radar_prospectos;
  v_faltan text[];
begin
  if not public.radar_puede_paso(p_paso) then
    raise exception 'No tienes asignado el paso %.', p_paso;
  end if;
  if p_paso < 3 then
    raise exception 'Los pasos 1 y 2 se cierran al elegir el prospecto.';
  end if;

  select * into v_prospecto from public.radar_prospectos where id = p_prospecto for update;
  if not found then
    raise exception 'El prospecto no existe.';
  end if;

  if exists (
    select 1 from public.radar_hitos
    where prospecto_id = p_prospecto and paso = p_paso and fecha_real is not null
  ) then
    raise exception 'Este paso ya está cerrado.';
  end if;

  if exists (
    select 1 from public.radar_hitos
    where prospecto_id = p_prospecto and paso = p_paso - 1 and fecha_real is null
  ) then
    raise exception 'Primero hay que cerrar el paso %.', p_paso - 1;
  end if;

  -- Entregables obligatorios
  if p_paso = 3 then
    select array_agg(t) into v_faltan
    from unnest(array['matriz_riesgos', 'guia_entendimiento', 'ficha_directivos', 'decision_pack']) t
    where not exists (
      select 1 from public.radar_archivos
      where prospecto_id = p_prospecto and paso = 3 and tipo = t
    );
    if v_faltan is not null then
      raise exception 'Faltan documentos de contexto: %.', array_to_string(v_faltan, ', ');
    end if;
  elsif p_paso = 4 then
    if coalesce(trim(v_prospecto.enfoque_servicio), '') = ''
       or coalesce(trim(v_prospecto.enfoque_angulo), '') = ''
       or coalesce(trim(v_prospecto.enfoque_cuidar), '') = '' then
      raise exception 'Falta llenar el enfoque: servicio, ángulo central y qué cuidar.';
    end if;
  elsif p_paso = 5 then
    if not exists (select 1 from public.radar_archivos where prospecto_id = p_prospecto and paso = 5 and tipo = 'nota_ejecutiva')
       or not exists (select 1 from public.radar_archivos where prospecto_id = p_prospecto and paso = 5 and tipo = 'plan_seguimiento') then
      raise exception 'Faltan la nota ejecutiva o el plan de seguimiento.';
    end if;
  elsif p_paso = 8 then
    if v_prospecto.fecha_envio is null then
      raise exception 'Falta registrar la fecha de envío.';
    end if;
  elsif p_paso = 9 then
    if coalesce(trim(v_prospecto.crm_url), '') = '' then
      raise exception 'Falta el enlace del prospecto en el CRM.';
    end if;
  end if;

  update public.radar_hitos
  set fecha_real = current_date, completado_por = auth.uid()
  where prospecto_id = p_prospecto and paso = p_paso;

  if p_paso = 6 then
    insert into public.radar_comentarios (prospecto_id, paso, tipo, texto)
    values (p_prospecto, 6, 'visto_bueno', coalesce(nullif(trim(p_texto), ''), 'Visto bueno.'));
  elsif p_paso = 8 then
    update public.radar_prospectos set estado = 'enviado' where id = p_prospecto;
  elsif p_paso = 9 then
    update public.radar_prospectos set estado = 'en_seguimiento' where id = p_prospecto;
  end if;
end;
$$;

-- Paso 6 con observaciones: suma una ronda y deja el comentario. JD sube la
-- nota corregida como versión nueva en el paso 5.
create or replace function public.radar_registrar_observaciones(p_prospecto bigint, p_texto text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.radar_puede_paso(6) then
    raise exception 'No tienes asignado el paso 6 (revisión y visto bueno).';
  end if;
  if coalesce(trim(p_texto), '') = '' then
    raise exception 'Escribe las observaciones.';
  end if;
  if not exists (
    select 1 from public.radar_hitos
    where prospecto_id = p_prospecto and paso = 5 and fecha_real is not null
  ) then
    raise exception 'La nota ejecutiva todavía no se ha entregado.';
  end if;

  update public.radar_prospectos set rondas = rondas + 1 where id = p_prospecto;
  insert into public.radar_comentarios (prospecto_id, paso, tipo, texto)
  values (p_prospecto, 6, 'observacion', trim(p_texto));
end;
$$;

-- Usuarios internos que el admin puede dar de alta en el Radar.
create or replace function public.radar_usuarios_internos()
returns table (user_id uuid, email text, rol text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.tiene_rol(array['admin']) then
    raise exception 'Solo administración puede ver la lista de usuarios.';
  end if;
  return query
    select r.user_id, u.email::text, r.rol
    from public.roles_usuario r
    join auth.users u on u.id = r.user_id
    where r.rol <> 'cliente'
    order by u.email;
end;
$$;

revoke execute on function public.radar_usuarios_internos() from anon;
revoke execute on function public.radar_elegir(bigint) from anon;
revoke execute on function public.radar_completar_paso(bigint, int, text) from anon;
revoke execute on function public.radar_registrar_observaciones(bigint, text) from anon;

-- ---------------------------------------------------------------------------
-- 6. El flujo definido
-- ---------------------------------------------------------------------------
insert into public.radar_pasos (paso, nombre, responsable, dia, desfase, entregable, como) values
  (1, 'Publicar lista corta del Radar', 'JD', 'Viernes', 0,
   '3 a 5 prospectos con score alto: señal, por qué es buen momento y servicios a ofrecer',
   'JD da de alta cada candidato en "Lista corta" con su score, la señal que lo dispara, por qué es buen momento y qué servicios se le ofrecerían.'),
  (2, 'Elegir el prospecto', 'José Luis y Jhon', 'Lunes', 1,
   'Prospecto elegido',
   'José Luis y Jhon revisan la lista corta y eligen uno. Al elegirlo, el sistema calcula las fechas de todos los pasos siguientes.'),
  (3, 'Correr la automatización comercial', 'JD', 'Miércoles', 3,
   'Documentos de contexto: matriz de riesgos y guía de entendimiento, ficha del CEO/CFO, Decision Pack',
   'JD corre la automatización y sube los cuatro documentos. El paso no se puede cerrar si falta alguno.'),
  (4, 'Estudiar el contexto y dar el enfoque', 'José Luis y Jhon', 'Viernes', 5,
   'Enfoque: servicio a ofrecer, ángulo central y qué cuidar',
   'José Luis y Jhon estudian los documentos y escriben el enfoque directamente en la ficha del prospecto.'),
  (5, 'Redactar nota ejecutiva y plan de seguimiento', 'JD', 'Martes', 7,
   'Nota ejecutiva y plan (LinkedIn, correos con asunto y cuerpo, secuencia de contactos)',
   'JD redacta con base en el enfoque y sube la nota ejecutiva y el plan de seguimiento.'),
  (6, 'Revisión y visto bueno', 'José Luis', 'Miércoles', 8,
   'Visto bueno. Si hay observaciones, JD corrige y reenvía hasta obtenerlo',
   'José Luis da el visto bueno o registra observaciones. Con observaciones, JD sube la nota corregida como versión nueva; el sistema cuenta las rondas.'),
  (7, 'Presentación a Arturo', 'José Luis', 'Jueves', 9,
   'Nota ejecutiva presentada',
   'José Luis presenta la nota a Arturo y marca el paso como hecho.'),
  (8, 'Aprobación y envío', 'Arturo', 'Viernes', 10,
   'Correo enviado al prospecto con la nota ejecutiva',
   'Arturo aprueba, envía el correo y registra la fecha de envío.'),
  (9, 'Seguimiento comercial', 'Diego', 'Desde el envío', 10,
   'Prospecto registrado en el CRM y seguimiento según el plan',
   'Diego registra al prospecto en el CRM, pega el enlace y sigue el plan de seguimiento.');

-- JD entra con sus pasos (1, 3 y 5). Como admin, da de alta al resto en "Accesos".
insert into public.radar_accesos (user_id, nombre, pasos)
select id, 'JD', array[1, 3, 5]
from auth.users where email = 'diego.morales@e360.pro'
on conflict (user_id) do nothing;
