const toggleBtn = document.getElementById('menu-toggle');
const closeBtn = document.getElementById('menu-close'); // este sigue funcionando si existe
const menuPanel = document.getElementById('hamburger-menu');
const overlay = document.getElementById('hamburger-overlay');
const submenu = document.getElementById('submenu-content');

// Submenús por sección
const submenuData = {
  inicio: [
    `<a href="/">Ir a la página principal</a>`
  ],
  nosotros: [
    `<a href="/nosotros#historia">Historia</a>`,
    `<a href="/nosotros#equipo">Nuestro Equipo</a>`,
    `<a href="/nosotros#certificaciones">Certificaciones</a>`
  ],
  servicios: [
    `<a href="/servicios/consultoria-financiera">Consultoría Financiera</a>`,
    `<a href="/servicios/auditoria">Auditoría</a>`,
    `<a href="/servicios/estrategias-fiscales">Estrategias Fiscales</a>`,
    `<a href="/servicios/tecnologia-automatizacion">Tecnología y Automatización</a>`
  ],
  mercado: [
    `<a href="/mercado#posicion">Posición de Mercado</a>`,
    `<a href="/mercado#casos-de-exito">Casos de Éxito</a>`,
    `<a href="/mercado#mapa">Mapa de Proyectos</a>`
  ],
  publicaciones: [
    `<a href="/publicaciones/blog">Blog</a>`,
    `<a href="/publicaciones/entrevistas">Entrevistas</a>`,
    `<a href="/publicaciones/reportajes">Reportajes</a>`
  ],
  contacto: [
    `<a href="/contacto#formulario">Formulario</a>`,
    `<a href="/contacto#mapa">Ubicación</a>`,
    `<a href="/contacto#datos">Datos de Contacto</a>`
  ]
};

// Abrir menú
function openMenu() {
  menuPanel.classList.remove('-translate-x-full');
  menuPanel.classList.add('translate-x-0');
  overlay.classList.remove('hidden');
  if (toggleBtn) toggleBtn.textContent = '✖';
  menuOpen = true;
}

// Cerrar menú
function closeMenu() {
  menuPanel.classList.add('-translate-x-full');
  menuPanel.classList.remove('translate-x-0');
  overlay.classList.add('hidden');
  if (toggleBtn) toggleBtn.textContent = '☰';
  menuOpen = false;
}

// Alternar menú desde el botón
let menuOpen = false;

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
    menuOpen = !menuOpen;
  });
}

// También cerrar con botón de cerrar interno (si existe)
if (closeBtn) closeBtn.addEventListener('click', closeMenu);
if (overlay) overlay.addEventListener('click', closeMenu);

// Cargar submenús
document.querySelectorAll('[data-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.getAttribute('data-section');
    loadSubmenu(section);
  });
});

function loadSubmenu(section) {
  submenu.innerHTML = submenuData[section]?.join('') || `<p class="text-gray-400">Selecciona una sección</p>`;
  submenu.classList.remove('animate-fade-in');
  void submenu.offsetWidth; // Reflow para reiniciar animación
  submenu.classList.add('animate-fade-in');
}