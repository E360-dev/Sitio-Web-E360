-- Restringe la lectura del inventario de tecnología al rol administrador.
begin;

drop policy if exists "cuentas tecnologia: lectura interna"
  on public.cuentas_tecnologia;

drop policy if exists "cuentas tecnologia: lectura admin"
  on public.cuentas_tecnologia;

create policy "cuentas tecnologia: lectura admin"
  on public.cuentas_tecnologia
  for select to authenticated
  using (public.tiene_rol(array['admin']));

notify pgrst, 'reload schema';
commit;
