-- Sector económico de cada empresa del Radar comercial.
alter table public.radar_prospectos
  add column if not exists sector text;
