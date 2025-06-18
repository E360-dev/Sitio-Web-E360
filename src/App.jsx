import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HeroBanner from './components/HeroBanner'
import KeyDifferentiators from './components/KeyDifferentiators'
import ImpactCarousel from './components/ImpactCarousel'
import MapaPresencia from './components/MapaPresencia'
// puedes importar más páginas aquí

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <HeroBanner />
      <KeyDifferentiators />
      <ImpactCarousel />
      <MapaPresencia />
      {/* puedes agregar <Routes><Route /></Routes> si usas páginas */}
    </BrowserRouter>
  )
}


export default App
// Este es el archivo principal de tu aplicación React. Aquí se configuran las rutas y se renderizan los componentes Header y Footer.
// Asegúrate de que los componentes Header y Footer estén correctamente implementados en sus respectivos archivos dentro de la carpeta `components`.
// Además, cada página (Inicio, Nosotros, Servicios, Mercado, Publicaciones, Contacto) debe estar implementada en su propia carpeta dentro de `pages`.
// Si necesitas ajustar las rutas para que funcionen correctamente en un servidor como SiteGround, asegure de que tu configuración de Vite esté correcta, especialmente si estás usando rutas relativas. Puedes agregar `base: './'` en tu archivo `vite.config.js` para asegurarte de que las rutas se resuelvan correctamente al desplegar en un servidor.
// También asegúrate de que tu archivo `tailwind.config.js` esté configurado correctamente para que Tailwind CSS funcione en tu proyecto. Esto incluye asegurarte de que las rutas de contenido estén correctamente definidas para que Tailwind pueda purgar el CSS no utilizado durante la construcción del proyecto.
// Por último, si estás utilizando un preloader o un carrusel, asegúrate de que los scripts y estilos necesarios estén correctamente importados y que la lógica de JavaScript esté funcionando como se espera. Puedes incluir esos scripts en el archivo `index.html` o importarlos directamente en tus componentes React si es necesario.
// No olvides instalar todas las dependencias necesarias, como React Router y Tailwind CSS, para que tu aplicación funcione correctamente. Puedes hacerlo ejecutando:
// ```bash