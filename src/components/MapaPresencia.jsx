// src/components/MapaPresencia.jsx
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const sedes = [
  { nombre: 'CDMX', coords: [19.4326, -99.1332] },
  { nombre: 'Guadalajara', coords: [20.6597, -103.3496] },
  { nombre: 'Monterrey', coords: [25.6866, -100.3161] },
  { nombre: 'Querétaro', coords: [20.5888, -100.3899] },
  { nombre: 'Cancún', coords: [21.1619, -86.8515] }
]

// 🔁 Forzar redimensionamiento en montaje
function ResizeHandler() {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
  }, [map])
  return null
}

const customIcon = new L.Icon({
  iconUrl: '/img/pin-e360.svg',
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40]
})

export default function MapaPresencia() {
  return (
    <section className="py-16 bg-white text-gray-800">
      <div className="max-w-7xl mx-auto px-4 text-center mb-6">
        <h2 className="text-2xl font-bold text-[#2e527f]">Presencia en México</h2>
        <p>Sedes estratégicas con cobertura nacional</p>
      </div>

      {/* Contenedor con altura explícita */}
      <div className="w-full max-w-6xl h-[500px] mx-auto shadow-lg rounded-xl overflow-hidden">
        <MapContainer
          center={[23.6345, -102.5528]}
          zoom={5}
          scrollWheelZoom={true}
          className="w-full h-full z-10"
        >
          <ResizeHandler />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {sedes.map((sede, i) => (
            <Marker key={i} position={sede.coords} icon={customIcon}>
              <Popup>{sede.nombre}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  )
}
