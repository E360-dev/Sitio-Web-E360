import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import logo from '/img/logo1.png';
import emailjs from 'emailjs-com'; // Import emailjs-com

// --- EmailJS Credentials (Hardcoded for quick implementation, consider environment variables for production) ---
// Service ID: service_tnjwgkf
// Template ID: template_76srass
// Public Key: NxbUW1aswQep0GsIF

emailjs.init("NxbUW1aswQep0GsIF"); // Initialize EmailJS with your Public Key


// --- Iconos de Redes Sociales (SVGs) ---
const LinkedInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.901 1.153h3.484l-9.025 10.395 10.525 13.693h-6.983l-6.71-8.69-7.882 8.69h-3.484l9.61-11.033-10.14-13.055h7.151l5.978 7.764 7.131-7.764zm-2.82 20.65h4.421l-12.28-15.88h-4.322l12.181 15.88z" />
  </svg>
);

export default function Footer() {
  const form = useRef();
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'success', 'error', 'sending'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const sendEmail = (e) => {
    e.preventDefault();
    setSubmissionStatus('sending');

    emailjs.sendForm('service_tnjwgkf', 'template_76srass', form.current, 'NxbUW1aswQep0GsIF')
      .then((result) => {
        console.log('Email successfully sent!', result.text);
        setSubmissionStatus('success');
        setFormData({ name: '', email: '', message: '' }); // Clear form
      }, (error) => {
        console.error('Email sending failed:', error.text);
        setSubmissionStatus('error');
      });
  };

  return (
    <footer className="bg-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="max-w-7xl mx-auto py-12 px-6 lg:py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Columna Izquierda: Logo y Páginas */}
          <div>
            <img className="h-16 w-auto" src={logo} alt="Logo E360" />
            <ul className="mt-4 space-y-2">
              <li><Link to="/" className="text-gray-700 hover:text-e360-accent">Inicio</Link></li>
              <li><Link to="/servicios" className="text-gray-700 hover:text-e360-accent">Servicios</Link></li>
              <li><Link to="/nosotros" className="text-gray-700 hover:text-e360-accent">Nosotros</Link></li>
            </ul>
          </div>

          {/* Columna Centro: Mensaje y Redes Sociales */}
          <div className="text-center text-e360-accent">
            <p className="text-lg font-semibold">
              Resolvemos lo complejo con claridad. ADN Big Four, Cercanía Humana.
            </p>
            <div className="flex justify-center space-x-6 mt-4">
              <a href="#" className="hover:text-e360-dark transition-colors duration-300">
                <span className="sr-only">LinkedIn</span>
                <LinkedInIcon />
              </a>
              <a href="#" className="hover:text-e360-dark transition-colors duration-300">
                <span className="sr-only">Twitter</span>
                <TwitterIcon />
              </a>
              <a href="#" className="hover:text-e360-dark transition-colors duration-300">
                <span className="sr-only">Facebook</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.35 17.5h-2.7v-7.5h-1.8v-2.5h1.8v-1.5c0-1.5 1.1-2.5 2.7-2.5h2v2.5h-1.5c-.5 0-.7.2-.7.7v1.3h2.2l-.3 2.5h-1.9v7.5z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-e360-dark transition-colors duration-300">
                <span className="sr-only">Instagram</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.07 1.645.07 4.85 0 3.204-.012 3.584-.07 4.85-1.049 3.197-2.655 4.77-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.85-.07-3.251-.148-4.77-1.699-4.919-4.919-.058-1.265-.07-1.644-.07-4.85 0-3.204.012-3.584.07-4.85 1.049-3.197 2.655-4.77 4.919-4.919 1.266-.057 1.645-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.21-6.78 2.648-6.993 6.993-.058 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.21 4.358 2.648 6.78 6.993 6.992 1.28.058 1.689.073 4.948.073 3.259 0 3.668-.014 4.948-.072 4.354-.21 6.782-2.648 6.991-6.993.058-1.281.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.21-4.358-2.648-6.782-6.992-6.991-1.281-.058-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-e360-dark transition-colors duration-300">
                <span className="sr-only">YouTube</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816v.038c.029 6.195.488 8.55 4.385 8.816 3.601.246 11.623.246 15.223 0 3.9-.266 4.35-2.621 4.385-8.816v-.038c-.029-6.195-.487-8.55-4.385-8.816zm-10.96 12.161v-6.999l6.195 3.5z"/>
                </svg>
              </a>
            </div>
            <p className="mt-8 text-base">&copy; 2025 E360. Todos los derechos reservados.</p>
          </div>

          {/* Columna Derecha: Formulario de Contacto */}
          <div id="contact-form">            <h3 className="text-lg font-semibold text-e360-accent w-3/4 ml-auto">Contáctanos</h3>
            <form onSubmit={sendEmail} ref={form} className="mt-4 space-y-4 w-3/4 ml-auto">
              <div>
                <label htmlFor="footer-name" className="sr-only">Nombre</label>
                <input type="text" name="name" id="footer-name" placeholder="Nombre" className="w-full px-4 py-2 border border-e360-highlight rounded-md focus:ring-e360-highlight focus:border-e360-highlight" value={formData.name} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="footer-email" className="sr-only">Email</label>
                <input type="email" name="email" id="footer-email" placeholder="Email" className="w-full px-4 py-2 border border-e360-highlight rounded-md focus:ring-e360-highlight focus:border-e360-highlight" value={formData.email} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="footer-message" className="sr-only">Mensaje</label>
                <textarea name="message" id="footer-message" rows="3" placeholder="Mensaje" className="w-full px-4 py-2 border border-e360-highlight rounded-md focus:ring-e360-highlight focus:border-e360-highlight" value={formData.message} onChange={handleChange} required></textarea>
              </div>
              <div>
                <button type="submit" disabled={submissionStatus === 'sending'} className="w-full px-4 py-2 bg-e360-accent text-white font-semibold rounded-md hover:bg-e360-dark">
                  {submissionStatus === 'sending' ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
              {submissionStatus === 'success' && <p className="text-green-500 text-sm mt-2">¡Mensaje enviado con éxito!</p>}
              {submissionStatus === 'error' && <p className="text-red-500 text-sm mt-2">Error al enviar el mensaje. Por favor, inténtalo de nuevo.</p>}
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
}