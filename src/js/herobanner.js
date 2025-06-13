const videoPlayer = document.getElementById('video-player');
const circleWrappers = document.querySelectorAll('.circle-indicator');
const indicators = document.querySelectorAll('.circle-indicator .progress');
const ctaButton = document.getElementById('cta-button');

const videos = [
  { src: '/videos/proposit.mp4', cta: 'Conoce nuestros servicios →', link: '#servicios' },
  { src: '/videos/producto.mp4', cta: 'Descubre nuestro enfoque →', link: '#nosotros' },
  { src: '/videos/experienci.mp4', cta: 'Ver credenciales →', link: '#mercado' }
];

let currentIndex = 0;

// Reinicia todos los círculos
function resetAllIndicators() {
  circleWrappers.forEach((wrapper) => {
    wrapper.classList.remove('active');
    const el = wrapper.querySelector('.progress');
    el.style.transition = 'none';
    el.style.strokeDashoffset = '100';
    void el.offsetHeight;
  });
}

// Activa el círculo del video actual
function animateCircle(index, duration) {
  resetAllIndicators();
  const wrapper = circleWrappers[index];
  const el = wrapper.querySelector('.progress');
  wrapper.classList.add('active');
  void el.offsetHeight;
  el.style.transition = `stroke-dashoffset ${duration}s linear`;
  el.style.strokeDashoffset = '0';
}

// Carga video y prepara todo
function loadVideo(index) {
  currentIndex = index;
  const video = videos[index];
  videoPlayer.src = video.src;
  ctaButton.textContent = video.cta;
  ctaButton.setAttribute('href', video.link);
}

// Reproduce cuando esté listo y sincroniza animación
videoPlayer.addEventListener('canplay', () => {
  const duration = videoPlayer.duration || 5;
  animateCircle(currentIndex, duration);
  videoPlayer.play();
});

// Cambio automático al terminar
videoPlayer.addEventListener('ended', () => {
  const nextIndex = (currentIndex + 1) % videos.length;
  loadVideo(nextIndex);
});

// Clics manuales
circleWrappers.forEach((wrapper, i) => {
  wrapper.addEventListener('click', () => {
    loadVideo(i);
  });
});

// Primera carga
loadVideo(currentIndex);