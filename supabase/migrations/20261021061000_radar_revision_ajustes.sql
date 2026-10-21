-- Include the real actor in actionable notifications. Preserve all ACLs.
begin;
create or replace function radar_privado.emitir(p_prospecto bigint,p_paso int,p_archivo bigint,p_accion text,p_detalle text,p_destinos int[] default '{}',p_actor uuid default auth.uid(),p_clave text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_evento bigint; v_empresa text;
begin
 select empresa into v_empresa from public.radar_prospectos where id=p_prospecto;
 insert into public.radar_actividad(prospecto_id,actor,paso,archivo_id,accion,detalle)
 values(p_prospecto,p_actor,p_paso,p_archivo,p_accion,p_detalle) returning id into v_evento;
 insert into public.radar_notificaciones(usuario_id,prospecto_id,paso,archivo_id,clave,titulo,texto)
 select a.user_id,p_prospecto,p_paso,p_archivo,coalesce(p_clave,'evento:'||v_evento),v_empresa,case when p_actor is null then p_detalle else coalesce((select nombre from public.radar_accesos where user_id=p_actor),'Equipo')||': '||p_detalle end
 from public.radar_accesos a where a.pasos && p_destinos and a.user_id is distinct from p_actor
 on conflict(usuario_id,clave) do update set texto=excluded.texto,leida_en=null,creado_en=now();
end; $$;
commit;
