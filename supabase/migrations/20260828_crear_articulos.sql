-- Blog editorial "E360 Comunica"
--
-- Los artículos los escriben los administradores desde el panel; el sitio
-- público los consume ya empaquetados en el build, no consultando esta tabla.
-- Aun así la lectura anónima queda abierta para los publicados, porque el
-- script de compilación usa la clave anónima.

create table if not exists public.articulos (
  id                bigint generated always as identity primary key,
  slug              text        not null unique,
  titulo            text        not null,
  resumen           text,
  contenido_html    text,
  portada_url       text,
  autor             text,
  publicado         boolean     not null default false,
  fecha_publicacion timestamptz,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

comment on column public.articulos.slug is
  'Parte final de la URL: /comunica/<slug>. Inmutable una vez publicado, cambiarlo rompe enlaces indexados y compartidos.';
comment on column public.articulos.autor is
  'Nombre del socio, tal como aparece en OurTeam.jsx, para enlazar con su ficha.';

-- Listado del blog y feed de la home: siempre por fecha de publicación.
create index if not exists articulos_publicados_idx
  on public.articulos (publicado, fecha_publicacion desc);

-- Mantener actualizado_en sin depender de que lo haga el cliente.
create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists articulos_actualizado_en on public.articulos;
create trigger articulos_actualizado_en
  before update on public.articulos
  for each row execute function public.tocar_actualizado_en();

-- ---------------------------------------------------------------------------
-- Seguridad a nivel de fila
-- ---------------------------------------------------------------------------
alter table public.articulos enable row level security;

-- Cualquiera puede leer lo publicado. Los borradores quedan invisibles.
drop policy if exists "articulos: lectura publica de publicados" on public.articulos;
create policy "articulos: lectura publica de publicados"
  on public.articulos
  for select
  using (publicado = true);

-- Escritura y lectura completa solo para administradores. Se resuelve contra
-- roles_usuario, la misma tabla que consulta el hook useRol.
drop policy if exists "articulos: administracion completa" on public.articulos;
create policy "articulos: administracion completa"
  on public.articulos
  for all
  using (
    exists (
      select 1 from public.roles_usuario ru
      where ru.user_id = auth.uid() and ru.rol = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.roles_usuario ru
      where ru.user_id = auth.uid() and ru.rol = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- Storage para las portadas
--
-- Bucket PÚBLICO, al contrario que documentos_privados: estas imágenes deben
-- verse sin autenticación, también desde LinkedIn al compartir un enlace.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('articulos_publicos', 'articulos_publicos', true)
on conflict (id) do nothing;

drop policy if exists "portadas: lectura publica" on storage.objects;
create policy "portadas: lectura publica"
  on storage.objects
  for select
  using (bucket_id = 'articulos_publicos');

drop policy if exists "portadas: escritura de administradores" on storage.objects;
create policy "portadas: escritura de administradores"
  on storage.objects
  for all
  using (
    bucket_id = 'articulos_publicos'
    and exists (
      select 1 from public.roles_usuario ru
      where ru.user_id = auth.uid() and ru.rol = 'admin'
    )
  )
  with check (
    bucket_id = 'articulos_publicos'
    and exists (
      select 1 from public.roles_usuario ru
      where ru.user_id = auth.uid() and ru.rol = 'admin'
    )
  );
