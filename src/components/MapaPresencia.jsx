import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Hook para detectar cuando el componente está en pantalla
const useOnScreen = (options) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, options);
    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [ref, options]);
  return [ref, isVisible];
};

const sedes = [
  { nombre: 'CDMX', coords: [19.4326, -99.1332] },
  { nombre: 'Guadalajara', coords: [20.6597, -103.3496] },
  { nombre: 'Monterrey', coords: [25.6866, -100.3161] },
  { nombre: 'Querétaro', coords: [20.5888, -100.3899] },
  { nombre: 'Cancún', coords: [21.1619, -86.8515] }
];

// Forzar redimensionamiento en montaje
function ResizeHandler() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

const customIcon = new L.Icon({
  iconUrl: '/img/pin-e360.svg',
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40]
});

export default function MapaPresencia() {
  const [ref, isVisible] = useOnScreen({ threshold: 0.2 });

  return (
    <section id="presencia" className="bg-white text-gray-900 overflow-hidden py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-base font-semibold leading-7 text-e360-cyan">Cobertura Nacional</h2>
        <p className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-e360-accent">
          Estamos donde nos necesitas
        </p>
        <div className="h-1 w-[36rem] mx-auto mt-4 bg-gradient-to-r from-e360-highlight via-e360-cyan to-e360-accent rounded-full"></div>
        <p className="mt-6 text-lg leading-8 text-gray-700">
          Nuestras sedes estratégicas nos permiten ofrecerte un servicio cercano y ágil en todo México.
        </p>

        <div
          ref={ref}
          className={`mt-16 transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {/* Contenedor con efecto glassmorphism */}
          <div className="relative p-4 sm:p-6 bg-white/40 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-2xl shadow-gray-300/40">
            <div className="w-full h-[500px] rounded-xl overflow-hidden">
              <MapContainer
                center={[23.6345, -102.5528]}
                zoom={5}
                scrollWheelZoom={true}
                className="w-full h-full z-10 map-dark-blue"
              >
                <ResizeHandler />
                {/* TileLayer con tema oscuro de CartoDB */}
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {sedes.map((sede, i) => (
                  <Marker key={i} position={sede.coords} icon={customIcon}>
                    <Popup>{sede.nombre}</Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
          .map-dark-blue .leaflet-tile-pane {
            filter: sepia(0.5) hue-rotate(180deg) saturate(2);
          }
        `}
      </style>
    </section>
  );
}
