import './style.css';

// Menú hamburguesa
const toggleBtn = document.getElementById('menu-toggle');
const closeBtn = document.getElementById('menu-close');
const menuPanel = document.getElementById('hamburger-menu');
const overlay = document.getElementById('hamburger-overlay');

function openMenu() {
  menuPanel.classList.remove('-translate-x-full');
  menuPanel.classList.add('translate-x-0');
  overlay.classList.remove('hidden');
}

function closeMenu() {
  menuPanel.classList.add('-translate-x-full');
  menuPanel.classList.remove('translate-x-0');
  overlay.classList.add('hidden');
}

if (toggleBtn) toggleBtn.addEventListener('click', openMenu);
if (closeBtn) closeBtn.addEventListener('click', closeMenu);
if (overlay) overlay.addEventListener('click', closeMenu);

// Preloader
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  document.body.classList.remove('preload');

  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('fade-out');
      setTimeout(() => {
        preloader.remove();
      }, 600);
    }, 1000);
  }
});

// carrusel impacto
const carousel = document.getElementById('impacto-carousel');
let impactoSlides = [...carousel.children];

function rotateImpacto(direction = 1) {
  if (direction === 1) {
    const first = impactoSlides.shift();
    impactoSlides.push(first);
  } else {
    const last = impactoSlides.pop();
    impactoSlides.unshift(last);
  }

  impactoSlides.forEach((slide, i) => {
    slide.classList.remove('scale-100', 'opacity-100', 'blur-none', 'z-20');
    slide.classList.remove('scale-90', 'opacity-50', 'blur-sm', 'z-10');

    if (i === 1) {
      slide.classList.add('scale-100', 'opacity-100', 'blur-none', 'z-20');
    } else {
      slide.classList.add('scale-90', 'opacity-50', 'blur-sm', 'z-10');
    }

    carousel.appendChild(slide);
  });
}

// Botones
document.getElementById('prevImpacto').addEventListener('click', () => rotateImpacto(-1));
document.getElementById('nextImpacto').addEventListener('click', () => rotateImpacto(1));

// Inicializar visibilidad correcta
rotateImpacto(0);

import '../js/menuhamburguesa.js';
import '../js/herobanner.js';