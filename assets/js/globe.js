import createGlobe from 'https://cdn.jsdelivr.net/npm/cobe@0.6.3/+esm';

const canvas = document.getElementById('globe');
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas) {
  // Face Jakarta (-6.2, 106.9) on load.
  const lat = -6.2;
  const lng = 106.9;
  let phi = Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2);
  const theta = (lat * Math.PI) / 180 + 0.25;

  let width = 0;
  let dragX = null;
  let dragOffset = 0;
  let velocity = 0;
  let visible = true;

  const measure = () => { width = canvas.offsetWidth; };
  measure();
  window.addEventListener('resize', measure);

  const globe = createGlobe(canvas, {
    devicePixelRatio: 2,
    width: width * 2,
    height: width * 2,
    phi,
    theta,
    dark: 1,
    diffuse: 1.4,
    mapSamples: 16000,
    mapBrightness: 5,
    mapBaseBrightness: 0.05,
    baseColor: [0.22, 0.3, 1],
    markerColor: [1, 0.81, 0.25],
    glowColor: [0.5, 0.6, 1],
    markers: [{ location: [lat, lng], size: 0.09 }],
    onRender(state) {
      if (!visible) return;
      if (dragX === null) {
        velocity *= 0.95;
        phi += (RM ? 0 : 0.0035) + velocity;
      }
      state.phi = phi + dragOffset;
      state.theta = theta;
      state.width = width * 2;
      state.height = width * 2;
    },
  });

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  let lastX = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragX = e.clientX;
    lastX = e.clientX;
    velocity = 0;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (dragX === null) return;
    dragOffset = (e.clientX - dragX) / 150;
    velocity = (e.clientX - lastX) / 300;
    lastX = e.clientX;
  });
  const end = () => {
    if (dragX === null) return;
    phi += dragOffset;
    dragOffset = 0;
    dragX = null;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  requestAnimationFrame(() => canvas.classList.add('is-ready'));
  window.addEventListener('pagehide', () => globe.destroy());
}
