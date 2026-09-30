(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EMAIL = 'alfalahlazuardim@gmail.com';
  const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);
  let lenis = null;

  /* ───────────── basics (no libraries needed) ───────────── */

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), 2000);
  }

  $('#copyBtn').addEventListener('click', () => {
    const ok = () => toast('Email copied ✓');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(EMAIL).then(ok, () => toast(EMAIL));
    else toast(EMAIL);
  });

  const clock = $('#clock');
  const tf = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
  const tick = () => { clock.textContent = tf.format(new Date()); };
  tick();
  setInterval(tick, 20000);
  $('#year').textContent = new Date().getFullYear();

  // roll-text for menu links
  $$('[data-roll]').forEach((el) => {
    const t = el.textContent;
    el.innerHTML = `<span class="roll-a">${t}</span><span class="roll-b" aria-hidden="true">${t}</span>`;
  });

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.5 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }

  /* ───────────── menu ───────────── */

  const menuBtn = $('#menuBtn');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open && HAS_GSAP && !RM) {
      gsap.fromTo('.menu-links a', { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.06, delay: 0.2 });
      gsap.fromTo('.menu-foot', { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.5 });
    }
  }
  menuBtn.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      const wasOpen = root.classList.contains('menu-open');
      setMenu(false);
      setTimeout(() => scrollToTarget(target), wasOpen ? 350 : 0);
    });
  });

  if (!HAS_GSAP) {
    const l = $('#loader');
    if (l) l.remove();
    return;
  }

  /* ───────────── GSAP-powered experience ───────────── */

  gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  if (!RM && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const splitInto = (el, cls, byWord) => {
    const parts = byWord ? el.textContent.trim().split(/\s+/) : [...el.textContent];
    el.textContent = '';
    parts.forEach((p, i) => {
      const s = document.createElement('span');
      s.className = cls;
      s.textContent = p === ' ' ? ' ' : p;
      el.appendChild(s);
      if (byWord && i < parts.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return $$('.' + cls, el);
  };

  /* cursor + spotlight + magnetic */
  const spot = $('#spotlight');
  window.addEventListener('pointermove', (e) => {
    spot.style.setProperty('--x', e.clientX + 'px');
    spot.style.setProperty('--y', e.clientY + 'px');
  }, { passive: true });

  if (FINE) {
    root.classList.add('has-cursor');
    const cur = $('#cursor');
    const cx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const grow = e.target.closest('[data-cursor="grow"]');
      const link = e.target.closest('a, button');
      cur.classList.toggle('is-grow', !!grow && !(link && !link.matches('[data-cursor="grow"]')));
      cur.classList.toggle('is-link', !!link && !cur.classList.contains('is-grow'));
    });
    document.addEventListener('mouseleave', () => gsap.to(cur, { opacity: 0, duration: 0.2 }));
    document.addEventListener('mouseenter', () => gsap.to(cur, { opacity: 1, duration: 0.2 }));

    if (!RM) {
      $$('[data-magnetic]').forEach((el) => {
        const xT = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.35)' });
        const yT = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.35)' });
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          xT((e.clientX - r.left - r.width / 2) * 0.3);
          yT((e.clientY - r.top - r.height / 2) * 0.3);
        });
        el.addEventListener('pointerleave', () => { xT(0); yT(0); });
      });
    }
  }

  /* hero shader */
  const shader = (function initShader() {
    const canvas = $('#gl');
    if (!window.THREE || !canvas) return null;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2) * 0.5);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.6, 0.55) },
      uScroll: { value: 0 },
      uIntro: { value: RM ? 1 : 0 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: 'void main(){ gl_Position = vec4(position, 1.0); }',
      fragmentShader: `
        precision highp float;
        uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform float uScroll; uniform float uIntro;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p), f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }
        float fbm(vec2 p){
          float v = 0.0, a = 0.5;
          mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
          for (int i = 0; i < 5; i++){ v += a * noise(p); p = m * p; a *= 0.5; }
          return v;
        }
        void main(){
          vec2 uv = gl_FragCoord.xy / uRes;
          float asp = uRes.x / uRes.y;
          vec2 p = vec2(uv.x * asp, uv.y);
          vec2 m = vec2(uMouse.x * asp, uMouse.y);
          float d = distance(p, m);
          p += (p - m) * 0.22 * exp(-d * 3.5);           // cursor lens
          float t = uTime * 0.05;
          vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 + vec2(5.2, 1.3) - t));
          vec2 r = vec2(fbm(p * 1.4 + 3.5 * q + vec2(1.7, 9.2) + t * 1.4), fbm(p * 1.4 + 3.5 * q + vec2(8.3, 2.8) - t));
          float f = fbm(p * 1.4 + 3.2 * r);
          vec3 ink = vec3(0.027, 0.027, 0.043);
          vec3 deep = vec3(0.10, 0.06, 0.32);
          vec3 violet = vec3(0.50, 0.42, 1.0);
          vec3 coral = vec3(1.0, 0.45, 0.33);
          vec3 col = mix(ink, deep, smoothstep(0.2, 0.8, f));
          col = mix(col, violet, smoothstep(0.45, 1.05, length(q)) * 0.85);
          col = mix(col, coral, smoothstep(0.55, 0.95, r.x) * 0.75);
          col += violet * 0.25 * exp(-d * 5.0);          // glow under cursor
          float vig = smoothstep(1.25, 0.25, length((uv - vec2(0.55, 0.6)) * vec2(1.0, 1.25)));
          col *= mix(0.25, 1.0, vig);
          col = mix(ink, col, uIntro * (1.0 - uScroll * 0.85));
          col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.035;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    const hero = $('#hero');
    function resize() {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      renderer.setSize(w, h, false);
      const pr = renderer.getPixelRatio();
      uniforms.uRes.value.set(w * pr, h * pr);
    }
    resize();
    window.addEventListener('resize', resize);

    const target = { x: 0.6, y: 0.55 };
    window.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = 1 - (e.clientY - r.top) / r.height;
    }, { passive: true });

    let visible = true;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(hero);
    const clock3 = new THREE.Clock();
    function frame() {
      requestAnimationFrame(frame);
      if (!visible) return;
      uniforms.uTime.value = clock3.getElapsedTime() + 20;
      const mu = uniforms.uMouse.value;
      mu.x += (target.x - mu.x) * 0.05;
      mu.y += (target.y - mu.y) * 0.05;
      renderer.render(scene, camera);
    }
    if (RM) { uniforms.uTime.value = 24; renderer.render(scene, camera); } else frame();

    ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onUpdate: (s) => { uniforms.uScroll.value = s.progress; } });
    return uniforms;
  })();

  /* loader → hero intro */
  function heroIntro() {
    if (RM) return;
    const tl = gsap.timeline();
    if (shader) tl.to(shader.uIntro, { value: 1, duration: 2.2, ease: 'power2.out' }, 0);
    tl.from('.ht-line > span', { yPercent: 115, rotate: 3, duration: 1.4, ease: 'expo.out', stagger: 0.09 }, 0.1)
      .from('.hero-eyebrow span', { y: 20, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08 }, 0.3)
      .from(['.hero-lede', '.scroll-cue'], { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1 }, 0.55)
      .from('.bar', { y: -30, opacity: 0, duration: 1, ease: 'power3.out' }, 0.4);
  }

  (function loader() {
    const el = $('#loader');
    if (RM) { el.remove(); if (shader) shader.uIntro.value = 1; return; }
    let quick = false;
    try { quick = sessionStorage.getItem('aurora-seen') === '1'; sessionStorage.setItem('aurora-seen', '1'); } catch (e) { /* ignore */ }
    if (lenis) lenis.stop();
    const pct = $('#ldPct');
    const o = { v: 0 };
    gsap.timeline()
      .from('.ld-name span', { yPercent: 110, duration: 1, ease: 'expo.out' })
      .from('.ld-meta', { opacity: 0, duration: 0.6 }, 0.2)
      .to(o, {
        v: 100,
        duration: quick ? 0.6 : 1.6,
        ease: 'power2.inOut',
        onUpdate: () => {
          pct.textContent = Math.round(o.v) + '%';
          $('#ldLine').style.width = o.v + '%';
        },
      }, 0.2)
      .to('.ld-name span', { yPercent: -110, duration: 0.7, ease: 'expo.in' }, '+=0.1')
      .to(['.ld-meta', '.ld-line'], { opacity: 0, duration: 0.4 }, '<')
      .to('.ld-top', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.1')
      .to('.ld-bot', { yPercent: 100, duration: 1.1, ease: 'expo.inOut' }, '<')
      .add(() => { if (lenis) lenis.start(); heroIntro(); }, '-=0.75')
      .add(() => el.remove());
  })();

  if (!RM) {
    /* hero parallax on scroll */
    gsap.to('.hero-content', {
      yPercent: -18, opacity: 0.2, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    /* side name reveal */
    gsap.from('.side-top > *', {
      y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: '.split', start: 'top 75%' },
    });

    /* about lead: word-by-word light-up */
    const lead = $('.about-lead');
    const strongText = lead.querySelector('strong').textContent.trim().split(/\s+/);
    const words = splitInto(lead, 'w', true);
    // keep the gradient emphasis on the words that were <strong>
    const leadWords = words.map((w) => w.textContent);
    for (let i = 0; i <= leadWords.length - strongText.length; i++) {
      if (strongText.every((s, k) => leadWords[i + k] === s)) {
        for (let k = 0; k < strongText.length; k++) {
          const s = document.createElement('strong');
          s.textContent = words[i + k].textContent;
          words[i + k].textContent = '';
          words[i + k].appendChild(s);
        }
        break;
      }
    }
    gsap.fromTo(words, { opacity: 0.12 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: lead, start: 'top 80%', end: 'bottom 50%', scrub: true },
    });

    /* generic fades */
    gsap.set('[data-fade]', { y: 40, opacity: 0 });
    ScrollTrigger.batch('[data-fade]', {
      start: 'top 90%',
      once: true,
      onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.08, clearProps: 'transform,opacity' }),
    });
  }

  /* top bar gets a background once the hero is gone */
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'bottom 80px',
    onEnter: () => $('#bar').classList.add('is-solid'),
    onLeaveBack: () => $('#bar').classList.remove('is-solid'),
  });

  /* side-nav active state */
  const sideLinks = $$('.side-nav a');
  ['about', 'impact', 'experience', 'stack', 'education'].forEach((id) => {
    ScrollTrigger.create({
      trigger: '#' + id,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (s) => {
        if (s.isActive) sideLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
      },
    });
  });

  /* impact: stacking cards + scramble numbers */
  (function impact() {
    const cards = $$('.icard');
    cards.forEach((card, i) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', e.clientX - r.left + 'px');
        card.style.setProperty('--my', e.clientY - r.top + 'px');
      });
      if (RM) return;
      const next = cards[i + 1];
      if (next) {
        gsap.fromTo(card, { scale: 1, filter: 'brightness(1)' }, {
          scale: 0.93, filter: 'brightness(0.6)', ease: 'none',
          scrollTrigger: { trigger: next, start: 'top 65%', end: `top ${110 + (i + 1) * 22}px`, scrub: true },
        });
      }
      const num = $('.ic-num', card);
      const final = num.dataset.scramble;
      ScrollTrigger.create({
        trigger: card,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          const digits = '0123456789';
          let frame = 0;
          const total = 28;
          const step = () => {
            frame++;
            const revealed = Math.floor((frame / total) * final.length);
            num.textContent = [...final].map((c, k) => (k < revealed || !/\d/.test(c) ? c : digits[Math.floor(Math.random() * 10)])).join('');
            if (frame < total) requestAnimationFrame(step); else num.textContent = final;
          };
          step();
          gsap.from($$('.ic-bars i', card), { scaleX: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12 });
        },
      });
    });
  })();

  /* stack: rotating orbit */
  (function orbit() {
    const wrap = $('#orbit');
    if (!matchMedia('(min-width: 700px)').matches) return;
    root.classList.add('has-orbit');
    const title = $('#ocTitle');
    const sub = $('#ocSub');
    const groups = $$('.sg');
    const rings = { 1: [], 2: [], 3: [] };
    const listSpans = [];
    groups.forEach((g) => {
      $$('p span', g).forEach((s) => {
        rings[g.dataset.ring].push({ name: s.textContent, level: g.dataset.level, span: s });
        listSpans.push(s);
      });
    });
    const conf = { 1: { r: 0.235, speed: 0.00022 }, 2: { r: 0.365, speed: -0.00016 }, 3: { r: 0.5, speed: 0.00011 } };
    const items = [];
    Object.entries(rings).forEach(([k, arr]) => {
      const line = document.createElement('div');
      line.className = 'ring-line';
      line.dataset.ring = k;
      wrap.appendChild(line);
      arr.forEach((it, i) => {
        const el = document.createElement('span');
        el.className = 'orb';
        el.dataset.l = it.level;
        el.textContent = it.name;
        wrap.appendChild(el);
        const o = { el, span: it.span, name: it.name, level: it.level, ring: Number(k), base: (i / arr.length) * Math.PI * 2 + Number(k) * 0.6 };
        items.push(o);
      });
    });

    let size = 0;
    function measure() {
      size = wrap.offsetWidth;
      $$('.ring-line', wrap).forEach((l) => {
        const d = conf[l.dataset.ring].r * 2 * size;
        l.style.width = l.style.height = d + 'px';
      });
    }
    measure();
    window.addEventListener('resize', measure);

    let speed = 1;
    let target = 1;
    const angles = { 1: 0, 2: 0, 3: 0 };
    let last = performance.now();
    let visible = false;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(wrap);

    function place(now) {
      requestAnimationFrame(place);
      const dt = Math.min(64, now - last);
      last = now;
      if (!visible) return;
      speed += (target - speed) * 0.08;
      Object.keys(angles).forEach((k) => { angles[k] += conf[k].speed * dt * speed * (RM ? 0 : 1); });
      items.forEach((o) => {
        const a = o.base + angles[o.ring];
        const R = conf[o.ring].r * size;
        o.el.style.transform = `translate(-50%, -50%) translate(${Math.cos(a) * R}px, ${Math.sin(a) * R * 0.92}px)`;
      });
    }
    requestAnimationFrame(place);

    function hot(o) {
      items.forEach((x) => x.el.classList.toggle('is-hot', x === o));
      listSpans.forEach((s) => s.classList.toggle('is-hot', o && s === o.span));
      wrap.classList.toggle('is-dimming', !!o);
      target = o ? 0 : 1;
      title.textContent = o ? o.name : 'My stack';
      sub.textContent = o ? o.level : 'hover a skill';
      if (o && !RM) gsap.fromTo(title, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' });
    }
    items.forEach((o) => {
      o.el.addEventListener('pointerenter', () => hot(o));
      o.el.addEventListener('pointerleave', () => hot(null));
      o.span.addEventListener('pointerenter', () => hot(o));
      o.span.addEventListener('pointerleave', () => hot(null));
    });

    if (!RM) {
      gsap.from(items.map((o) => o.el), {
        scale: 0, opacity: 0, duration: 0.9, ease: 'back.out(1.8)', stagger: 0.035,
        scrollTrigger: { trigger: wrap, start: 'top 75%' },
      });
      gsap.from('.orbit-core', { scale: 0.4, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: wrap, start: 'top 75%' } });
    }
  })();

  /* contact: letters that react to the cursor */
  (function contactBig() {
    const big = $('#contactBig');
    const chars = splitInto(big, 'c', false);
    chars.forEach((c) => c.setAttribute('aria-hidden', 'true'));
    if (RM) return;
    gsap.from(chars, {
      yPercent: 100, opacity: 0, rotate: 8, duration: 1.2, ease: 'expo.out', stagger: 0.04,
      scrollTrigger: { trigger: big, start: 'top 85%' },
    });
    if (!FINE) return;
    const setters = chars.map((c) => ({
      c,
      y: gsap.quickTo(c, 'y', { duration: 0.6, ease: 'power3' }),
      s: gsap.quickTo(c, 'scaleY', { duration: 0.6, ease: 'power3' }),
    }));
    const section = $('#contact');
    section.addEventListener('pointermove', (e) => {
      setters.forEach(({ c, y, s }) => {
        const r = c.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        const f = Math.max(0, 1 - d / 320);
        y(-f * 38);
        s(1 + f * 0.18);
        c.style.color = f > 0.55 ? 'var(--coral)' : '';
      });
    });
    section.addEventListener('pointerleave', () => setters.forEach(({ c, y, s }) => { y(0); s(1); c.style.color = ''; }));
  })();

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
