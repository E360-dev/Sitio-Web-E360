import { useState } from 'react'
import { Link } from 'react-router-dom'

const submenuData = {
  inicio: [<Link to="/">Ir a la página principal</Link>],
  nosotros: [
    <a href="/nosotros#historia">Historia</a>,
    <a href="/nosotros#equipo">Nuestro Equipo</a>,
    <a href="/nosotros#certificaciones">Certificaciones</a>
  ],
  servicios: [
    <a href="/servicios/consultoria-financiera">Consultoría Financiera</a>,
    <a href="/servicios/auditoria">Auditoría</a>,
    <a href="/servicios/estrategias-fiscales">Estrategias Fiscales</a>,
    <a href="/servicios/tecnologia-automatizacion">Tecnología y Automatización</a>
  ],
  mercado: [
    <a href="/mercado#posicion">Posición de Mercado</a>,
    <a href="/mercado#casos-de-exito">Casos de Éxito</a>,
    <a href="/mercado#mapa">Mapa de Proyectos</a>
  ],
  publicaciones: [
    <a href="/publicaciones/blog">Blog</a>,
    <a href="/publicaciones/entrevistas">Entrevistas</a>,
    <a href="/publicaciones/reportajes">Reportajes</a>
  ],
  contacto: [
    <a href="/contacto#formulario">Formulario</a>,
    <a href="/contacto#mapa">Ubicación</a>,
    <a href="/contacto#datos">Datos de Contacto</a>
  ]
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [submenu, setSubmenu] = useState(null)

  const handleToggle = () => setMenuOpen(!menuOpen)
  const closeMenu = () => setMenuOpen(false)

  const handleSectionClick = (section) => {
    setSubmenu(section)
    setMenuOpen(true)
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeMenu}
        className={`fixed inset-0 bg-black/70 z-40 ${menuOpen ? 'block' : 'hidden'}`}
      ></div>

      {/* Navbar */}
      <nav className="fixed top-4 left-0 w-full z-50 py-3 bg-transparent text-white">
        <div className="relative w-full flex items-center justify-between px-4 md:px-8">
          {/* Logo a la izquierda */}
          <Link to="/" className="flex-shrink-0">
            <img src="/img/logo.png" alt="E360 Logo" className="h-16 w-auto" />
          </Link>

          {/* Menú en escritorio */}
          <div className="hidden md:flex gap-6 items-center">
            {Object.keys(submenuData).map((section) => (
              <button
                key={section}
                onClick={() => handleSectionClick(section)}
                className="hover:text-[#7fa1c7] transition"
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </div>

          {/* Botón hamburguesa visible solo en móvil */}
          <button
            onClick={handleToggle}
            className="md:hidden text-3xl hover:text-[#2e527f] transition"
            aria-label="Abrir menú"
          >
            {menuOpen ? '✖' : '☰'}
          </button>
        </div>
      </nav>

      {/* Menú lateral */}
      <div
        className={`fixed inset-y-0 left-0 w-full max-w-3xl flex z-50 transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Panel izquierdo */}
        <div className="w-1/3 min-w-[10rem] bg-[#181818] flex flex-col justify-center px-6 py-12 space-y-6 text-white text-lg font-semibold sm:w-1/2">
          <nav className="flex flex-col gap-4 mt-6">
            {Object.keys(submenuData).map((section) => (
              <button
                key={section}
                className="text-left hover:text-[#7fa1c7] transition"
                onClick={() => handleSectionClick(section)}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Panel derecho con submenús */}
        <div className="w-2/3 bg-[#111] relative flex flex-col justify-center px-8 py-6 text-white text-lg font-semibold">
          <button
            onClick={closeMenu}
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl transition"
            aria-label="Cerrar menú"
          >
            &times;
          </button>
          <div className="flex flex-col gap-4 mt-6 animate-fade-in">
            {submenu && submenuData[submenu]?.length > 0
              ? submenuData[submenu].map((el, i) => <div key={i}>{el}</div>)
              : <p className="text-gray-400">Selecciona una sección</p>}
          </div>
        </div>
      </div>
    </>
  )
}