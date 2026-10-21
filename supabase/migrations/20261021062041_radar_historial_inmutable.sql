-- Keep registered originals immutable in Storage as well as in metadata.
begin;
drop policy if exists "radar: borrar admin" on storage.objects;

-- The automatic step-1 close belongs to its actual creator, not the selector.
create or replace function radar_privado.hito_evento() returns trigger language plpgsql security definer set search_path='' as $$
declare v_siguiente int; v_nombre text; v_destinos int[];
begin
 if new.fecha_real is not null and old.fecha_real is null then
  select nombre into v_nombre from public.radar_pasos where paso=new.paso;
  select p.paso into v_siguiente from public.radar_pasos p join public.radar_hitos h on h.paso=p.paso
    where h.prospecto_id=new.prospecto_id and h.fecha_real is null and not h.exento_revision order by p.orden limit 1;
  v_destinos:=case when new.paso=10 then array[3,4] else array_remove(array[v_siguiente],null) end;
  perform radar_privado.emitir(new.prospecto_id,new.paso,null,'paso_completado',
   v_nombre||' completado'||case when v_siguiente is not null then '. Se habilitó: '||(select nombre from public.radar_pasos where paso=v_siguiente) else '.' end,
   case when new.paso=1 then '{}'::int[] else v_destinos end,new.completado_por);
 elsif new.fecha_compromiso is distinct from old.fecha_compromiso then
  perform radar_privado.emitir(new.prospecto_id,new.paso,null,'fecha_modificada',
   'Nueva fecha de '||(select etiqueta from public.radar_pasos where paso=new.paso)||': '||new.fecha_compromiso,array[new.paso]);
 end if;
 return null;
end; $$;
commit;
