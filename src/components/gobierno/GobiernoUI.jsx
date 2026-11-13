import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ScaleIcon, BuildingLibraryIcon, CheckBadgeIcon, LockClosedIcon, UserGroupIcon, GlobeAltIcon, LinkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const iconos = { etica: ScaleIcon, gobierno: BuildingLibraryIcon, calidad: CheckBadgeIcon, privacidad: LockClosedIcon, personas: UserGroupIcon, entorno: GlobeAltIcon, proveedores: LinkIcon };

export function IconoGobierno({ nombre, className = 'h-7 w-7' }) {
  const Icono = iconos[nombre] || BuildingLibraryIcon;
  return <Icono aria-hidden="true" className={className} />;
}

export function useFocoGobierno() {
  const titulo = useRef(null);
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    titulo.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return titulo;
}

export function RutaGobierno({ titulo }) {
  return <nav aria-label="Ruta de navegación" className="gobierno-breadcrumb">
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
      <li><Link to="/">Inicio</Link></li>
      <li aria-hidden="true"><ChevronRightIcon className="h-3 w-3" /></li>
      {titulo ? <>
        <li><Link to="/gobierno">Gobierno de la firma</Link></li>
        <li aria-hidden="true"><ChevronRightIcon className="h-3 w-3" /></li>
        <li aria-current="page" className="font-medium">{titulo}</li>
      </> : <li aria-current="page" className="font-medium">Gobierno de la firma</li>}
    </ol>
  </nav>;
}

export function EstadoDocumento({ datos }) {
  return <div className="gobierno-version">
    <span className="inline-flex items-center gap-2 font-semibold"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-600" />Borrador para revisión · v{datos.version}</span>
    <span>Preparado el <time dateTime={datos.fechaPreparacion}>13 de noviembre de 2026</time></span>
    <span>Vigencia pública pendiente de aprobación</span>
  </div>;
}
