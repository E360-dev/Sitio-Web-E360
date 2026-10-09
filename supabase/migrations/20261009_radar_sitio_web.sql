-- Enlace público de la empresa (sitio web o perfil de LinkedIn).
alter table public.radar_prospectos
  add column if not exists sitio_web text;
