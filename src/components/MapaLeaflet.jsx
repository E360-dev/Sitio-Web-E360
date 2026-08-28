// src/components/MapaLeaflet.jsx
//
// Aislado de MapaPresencia a propósito: aquí viven los únicos imports de
// leaflet y react-leaflet del sitio público. Al cargarse con React.lazy,
// Vite los empaqueta en un chunk aparte que no entra en la carga inicial.

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

export default function MapaLeaflet() {
  return (
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
  );
}
