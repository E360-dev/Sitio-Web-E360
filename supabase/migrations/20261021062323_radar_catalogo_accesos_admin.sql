-- Administrators can assign catalog steps before joining the Radar themselves.
-- This does not grant access to prospects, files, comments or notifications.
begin;
drop policy "radar_pasos: lectura" on public.radar_pasos;
create policy "radar_pasos: lectura" on public.radar_pasos for select to authenticated
using ((select public.radar_tiene_acceso()) or (select public.tiene_rol(array['admin'])));
commit;
