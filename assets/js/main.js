(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EMAIL = 'alfalahlazuardim@gmail.com';
  const ACCENT = 0xd4ff3a;
  const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);

  let lenis = null;

  /* ─────────────────────────── helpers ─────────────────────────── */

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function copyEmail() {
    const done = () => toast('Email copied to clipboard ✓');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(done).catch(() => toast(EMAIL));
    } else {
      toast(EMAIL);
    }
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }

  /* ─────────────────────── lib-independent bits ─────────────────────── */

  function initClock() {
    const el = $('#clock');
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
    if (!el) return;
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
    const tick = () => { el.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 20000);
  }

  function initNavText() {
    $$('[data-hover-text]').forEach((a) => {
      const t = a.textContent.trim();
      a.innerHTML = `<span>${t}</span><span aria-hidden="true">${t}</span>`;
    });
  }

  function initAnchors() {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const target = id === '#top' ? 0 : $(id);
        if (target === null) return;
        e.preventDefault();
        scrollToTarget(target);
      });
    });
  }

  function initCopy() {
    const btn = $('#copyBtn');
    if (btn) btn.addEventListener('click', copyEmail);
  }

  /* ───────────────────────────── role scramble ───────────────────────────── */

  function scrambleTo(el, text) {
    return new Promise((resolve) => {
      const glyphs = '!<>-_\\/[]{}=+*^?#01';
      const from = el.textContent;
      const len = Math.max(from.length, text.length);
      const queue = [];
      for (let i = 0; i < len; i++) {
        const start = Math.floor(Math.random() * 18);
        queue.push({ from: from[i] || '', to: text[i] || '', start, end: start + Math.floor(Math.random() * 18) + 4, ch: '' });
      }
      let frame = 0;
      const step = () => {
        let out = '';
        let done = 0;
        for (const q of queue) {
          if (frame >= q.end) { done++; out += q.to; }
          else if (frame >= q.start) {
            if (!q.ch || Math.random() < 0.3) q.ch = glyphs[Math.floor(Math.random() * glyphs.length)];
            out += q.ch;
          } else out += q.from;
        }
        el.textContent = out;
        if (done === queue.length) resolve();
        else { frame++; requestAnimationFrame(step); }
      };
      step();
    });
  }

  async function initRoles() {
    const el = $('#roleText');
    if (!el || RM) return;
    const roles = [
      'Backend Engineer',
      'Node.js · TypeScript · Golang',
      '5 years shipping production systems',
      'I make slow things fast',
      'Open to roles worldwide',
    ];
    let i = 0;
    for (;;) {
      await sleep(2800);
      i = (i + 1) % roles.length;
      await scrambleTo(el, roles[i]);
    }
  }

  /* ───────────────────────────── terminal ───────────────────────────── */

  function initTerminal() {
    const out = $('#termOut');
    const input = $('#termIn');
    const body = $('#termBody');
    const term = $('#term');
    if (!out || !input) return;

    const history = [];
    let hIdx = 0;
    let busy = false;

    const print = (html, cls = '') => {
      const d = document.createElement('div');
      if (cls) d.className = cls;
      d.innerHTML = html;
      out.appendChild(d);
      body.scrollTop = body.scrollHeight;
    };
    const echoCmd = (cmd) => print(`<span class="term-ps">falah@dev:~$</span> ${escapeHtml(cmd)}`, 't-cmd');

    const commands = {
      help: {
        desc: 'list available commands',
        run: () => {
          const rows = Object.entries(commands)
            .filter(([, c]) => !c.hidden)
            .map(([k, c]) => `  <span class="t-acc">${k.padEnd(12)}</span><span class="t-dim">${c.desc}</span>`);
          print(['Available commands:', ...rows, '', '<span class="t-dim">tip: ↑/↓ for history, tab to autocomplete</span>'].join('\n'));
        },
      },
      whoami: {
        desc: 'who is this guy?',
        run: () => print([
          '<span class="t-acc">Al Falah Lazuardi</span> — Backend Engineer',
          'Node.js · TypeScript · Golang · 5 years in production',
          'Ride-hailing, fintech and government infrastructure.',
          '<span class="t-dim">I ship fast backends. Then I make them faster.</span>',
        ].join('\n')),
      },
      experience: {
        desc: 'work history',
        run: () => print([
          '<span class="t-acc">2023 — now </span>  PT Code Development Indonesia   <span class="t-dim">Backend Engineer</span>',
          '<span class="t-acc">2023 — 2024</span>  PT Stafbook Teknologi Asia      <span class="t-dim">Backend Engineer · Contract</span>',
          '<span class="t-acc">2020 — 2023</span>  PT Solu Filantropi Teknologi    <span class="t-dim">Backend Engineer</span>',
        ].join('\n')),
      },
      metrics: {
        desc: 'numbers I am proud of',
        run: () => print([
          'api_throughput      <span class="t-acc">12×</span>     <span class="t-dim">O(n²) → O(n log n)</span>',
          'query_latency       <span class="t-acc">−60%</span>    <span class="t-dim">indexing + rewrites</span>',
          'import_capacity     <span class="t-acc">200 → 3,000+</span> records/job',
          'payroll_speed       <span class="t-acc">10×</span>',
          'daily_transactions  <span class="t-acc">15,000+</span> <span class="t-dim">−85% error rate</span>',
        ].join('\n')),
      },
      skills: {
        desc: 'tech stack',
        run: () => print([
          '<span class="t-acc">expert</span>        Node.js, TypeScript, Golang, Laravel/PHP, REST API,',
          '              Microservices, PostgreSQL, MySQL, Redis, Git',
          '<span class="t-acc">advanced</span>      Docker, AWS S3, Kafka, WebSocket, Event-driven architecture',
          '<span class="t-acc">intermediate</span>  CI/CD',
          '<span class="t-vio">daily tooling</span> Claude Code, GPT Codex, AI-assisted development',
        ].join('\n')),
      },
      education: {
        desc: 'school & awards',
        run: () => print([
          '<span class="t-acc">2021 — 2025</span>  B.Sc. Information Systems · Binus University',
          '<span class="t-acc">2017 — 2021</span>  Computer Science Vocational · SMK Negeri 26 Jakarta',
          '             🏆 3rd Place · Web Design LKS SMK',
          '             🏆 3rd Place · Smartschool SEACC Batch 3 (Southeast Asia)',
        ].join('\n')),
      },
      contact: {
        desc: 'how to reach me',
        run: () => print([
          `email     <a class="t-acc" href="mailto:${EMAIL}">${EMAIL}</a>`,
          'phone     +62 851 7300 9061',
          'location  East Jakarta, Indonesia · remote or relocate worldwide',
          'visa      open to sponsorship',
        ].join('\n')),
      },
      'sudo hire falah': {
        desc: 'you know you want to',
        run: async () => {
          print('<span class="t-dim">[sudo] password for recruiter: ********</span>');
          await sleep(500);
          const steps = ['verifying experience', 'running benchmarks', 'checking culture fit'];
          for (const s of steps) {
            print(`<span class="t-dim">→ ${s}...</span> <span class="t-acc">ok</span>`);
            await sleep(380);
          }
          print(`\n<span class="t-acc">✔ Candidate approved.</span> Next step: <a class="t-acc" href="mailto:${EMAIL}?subject=Let's%20talk">send the email →</a>`);
          if (HAS_GSAP && !RM) confetti();
        },
      },
      ls: { desc: 'list files', run: () => print('<span class="t-acc">about.md</span>  <span class="t-acc">experience/</span>  <span class="t-acc">skills.json</span>  <span class="t-acc">resume.pdf</span>  <span class="t-vio">secret.txt</span>') },
      'cat secret.txt': { hidden: true, desc: '', run: () => print('I actually enjoy reading EXPLAIN ANALYZE output. 🤫') },
      date: { desc: 'local time in Jakarta', run: () => print(new Date().toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' }) + ' WIB') },
      clear: { desc: 'clear the screen', run: () => { out.innerHTML = ''; } },
    };

    const names = Object.keys(commands);

    async function run(raw) {
      const cmd = raw.trim().replace(/\s+/g, ' ');
      echoCmd(raw);
      if (!cmd) return;
      history.push(cmd);
      hIdx = history.length;
      const lc = cmd.toLowerCase();
      if (commands[lc]) { await commands[lc].run(); return; }
      if (lc.startsWith('echo ')) { print(escapeHtml(cmd.slice(5))); return; }
      if (lc === 'sudo' || lc.startsWith('sudo ')) { print('<span class="t-err">hint:</span> try <span class="t-acc">sudo hire falah</span>'); return; }
      if (lc === 'cat resume.pdf') { print('<span class="t-dim">binary file — try</span> <span class="t-acc">experience</span>'); return; }
      const guess = names.find((n) => n.startsWith(lc[0] || '~') && !commands[n].hidden);
      print(`<span class="t-err">command not found:</span> ${escapeHtml(cmd)}${guess ? `  <span class="t-dim">— did you mean</span> <span class="t-acc">${guess}</span>?` : ''}`);
    }

    async function typeAndRun(cmd) {
      if (busy) return;
      busy = true;
      input.value = '';
      for (const ch of cmd) {
        input.value += ch;
        await sleep(RM ? 0 : 38 + Math.random() * 40);
      }
      await sleep(140);
      input.value = '';
      await run(cmd);
      busy = false;
    }

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (busy) return;
        const v = input.value;
        input.value = '';
        busy = true;
        await run(v);
        busy = false;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (hIdx > 0) input.value = history[--hIdx];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        hIdx = Math.min(history.length, hIdx + 1);
        input.value = history[hIdx] || '';
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const v = input.value.toLowerCase();
        const m = names.filter((n) => n.startsWith(v) && !commands[n].hidden);
        if (m.length === 1) input.value = m[0];
        else if (m.length > 1) { echoCmd(input.value); print(m.join('   '), 't-dim'); }
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        out.innerHTML = '';
      }
    });

    term.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      if (window.getSelection && String(window.getSelection())) return;
      input.focus({ preventScroll: true });
    });

    $$('[data-cmd]').forEach((b) => b.addEventListener('click', () => typeAndRun(b.dataset.cmd)));

    print('<span class="t-dim">falah.dev shell v2.0 — type</span> <span class="t-acc">help</span> <span class="t-dim">to get started.</span>\n');

    // Auto-type an intro the first time the terminal scrolls into view.
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) {
        io.disconnect();
        setTimeout(() => typeAndRun('whoami'), 400);
      }
    }, { threshold: 0.5 });
    io.observe(term);
  }

  /* ───────────────────── everything below needs GSAP ───────────────────── */

  function confetti() {
    const colors = ['#d4ff3a', '#9b87ff', '#f1efe9', '#3ddc84'];
    const box = $('#term').getBoundingClientRect();
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('i');
      Object.assign(p.style, {
        position: 'fixed',
        left: box.left + box.width / 2 + 'px',
        top: box.top + box.height / 2 + 'px',
        width: 6 + Math.random() * 6 + 'px',
        height: 10 + Math.random() * 8 + 'px',
        background: colors[i % colors.length],
        zIndex: 400,
        pointerEvents: 'none',
        borderRadius: '2px',
      });
      document.body.appendChild(p);
      gsap.to(p, {
        x: (Math.random() - 0.5) * 700,
        y: (Math.random() - 0.9) * 500,
        rotation: Math.random() * 720,
        duration: 1 + Math.random(),
        ease: 'power3.out',
      });
      gsap.to(p, { y: '+=400', opacity: 0, delay: 0.9, duration: 1, ease: 'power2.in', onComplete: () => p.remove() });
    }
  }

  function initLenis() {
    if (RM || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((c) => {
      const m = document.createElement('span');
      m.className = 'chm';
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c === ' ' ? ' ' : c;
      m.appendChild(s);
      el.appendChild(m);
    });
  }

  function splitWords(el, wrapCls = 'w') {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = wrapCls;
            const inner = document.createElement('span');
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  }

  function preloader(onDone) {
    const pl = $('#preloader');
    if (!pl) return onDone();
    if (RM) { pl.remove(); return onDone(); }

    let seen = false;
    try { seen = sessionStorage.getItem('falah-booted') === '1'; sessionStorage.setItem('falah-booted', '1'); } catch (e) { /* storage blocked */ }

    const lines = [
      '[ ok ] postgres: connection pool ready (12/12)',
      '[ ok ] redis: pub/sub channel subscribed',
      '[ ok ] kafka: consumer group joined',
      '[ ok ] api-gateway: listening on :443',
      '[ ok ] healthcheck: p99 latency 38ms',
      '[ ok ] all services healthy — welcome',
    ];
    const log = $('#plLog');
    const cnt = $('#plCount');
    const bar = $('#plBar');
    const o = { v: 0 };
    if (lenis) lenis.stop();

    gsap.timeline()
      .to(o, {
        v: 100,
        duration: seen ? 0.7 : 2.1,
        ease: 'power2.inOut',
        onUpdate() {
          const v = Math.round(o.v);
          cnt.textContent = String(v).padStart(3, '0');
          bar.style.width = v + '%';
          const n = Math.floor((v / 100) * lines.length);
          while (log.children.length < n) {
            const d = document.createElement('div');
            d.innerHTML = lines[log.children.length].replace('[ ok ]', '<b>[ ok ]</b>');
            log.appendChild(d);
          }
        },
      })
      .to(pl, { yPercent: -100, duration: 1.05, ease: 'expo.inOut' }, '+=0.15')
      .add(() => { if (lenis) lenis.start(); onDone(); }, '-=0.6')
      .add(() => pl.remove());
  }

  function heroIntro() {
    const chars = $$('.hero-name .ch');
    if (RM) return;
    gsap.timeline()
      .from(chars, { yPercent: 115, rotate: 10, duration: 1.3, ease: 'expo.out', stagger: 0.035 })
      .from(['.hm-item', '.hero-role', '.hero-cta .btn'], { y: 26, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, 0.35)
      .from('#net', { opacity: 0, duration: 2 }, 0)
      .add(() => gsap.set('.hero-name .chm', { overflow: 'visible' }));
  }

  function initHero() {
    $$('[data-split]').forEach(splitChars);

    // playful char hover
    $$('.hero-name .ch').forEach((ch) => {
      const base = getComputedStyle(ch).color;
      ch.addEventListener('pointerenter', () => {
        gsap.timeline({ overwrite: 'auto' })
          .to(ch, { yPercent: -16, scaleY: 1.12, color: '#d4ff3a', duration: 0.22, ease: 'power2.out' })
          .to(ch, { yPercent: 0, scaleY: 1, duration: 0.7, ease: 'elastic.out(1, 0.35)' })
          .to(ch, { color: base, duration: 0.8 }, '-=0.3');
      });
    });

    if (RM) return;
    const st = { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hn-line:nth-child(1)', { xPercent: -14, ease: 'none', scrollTrigger: st });
    gsap.to('.hn-line:nth-child(2)', { xPercent: 12, ease: 'none', scrollTrigger: st });
    gsap.to('.hero-inner', { y: -60, opacity: 0.25, ease: 'none', scrollTrigger: st });
  }

  function initNetwork() {
    const canvas = $('#net');
    const hero = $('#hero');
    if (!window.THREE || !canvas) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0, 16);
    const group = new THREE.Group();
    scene.add(group);

    // round sprite texture
    const tc = document.createElement('canvas');
    tc.width = tc.height = 64;
    const g = tc.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.9)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const dotTex = new THREE.CanvasTexture(tc);

    const mobile = window.innerWidth < 760;
    const N = mobile ? 90 : 170;
    const R = mobile ? 6.2 : 8.5;
    const nodes = [];
    for (let i = 0; i < N; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = R * Math.cbrt(0.15 + Math.random() * 0.85);
      nodes.push(new THREE.Vector3(
        r * Math.sin(ph) * Math.cos(th) * (mobile ? 1 : 1.55),
        r * Math.sin(ph) * Math.sin(th) * 0.85,
        r * Math.cos(ph)
      ));
    }

    // edges between near neighbours
    const maxD = mobile ? 2.7 : 2.6;
    const adj = nodes.map(() => []);
    const edges = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        if (adj[i].length >= 5 || adj[j].length >= 5) continue;
        if (nodes[i].distanceTo(nodes[j]) < maxD) {
          edges.push([i, j]);
          adj[i].push(j);
          adj[j].push(i);
        }
      }
    }

    const nodePos = new Float32Array(N * 3);
    const nodeCol = new Float32Array(N * 3);
    const acc = new THREE.Color(ACCENT);
    const wht = new THREE.Color(0xf1efe9);
    nodes.forEach((v, i) => {
      nodePos.set([v.x, v.y, v.z], i * 3);
      const c = Math.random() < 0.14 ? acc : wht;
      nodeCol.set([c.r, c.g, c.b], i * 3);
    });
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeCol, 3));
    const nodeMat = new THREE.PointsMaterial({ size: 0.16, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, opacity: 0.85 });
    group.add(new THREE.Points(nodeGeo, nodeMat));

    const linePos = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], k) => {
      linePos.set([nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z], k * 6);
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0xf1efe9, transparent: true, opacity: 0.1 });
    group.add(new THREE.LineSegments(lineGeo, lineMat));

    // "requests" travelling along the edges
    const P = mobile ? 22 : 48;
    const pulses = [];
    const connected = nodes.map((_, i) => i).filter((i) => adj[i].length);
    for (let i = 0; i < P && connected.length; i++) {
      const a = connected[Math.floor(Math.random() * connected.length)];
      pulses.push({ a, b: adj[a][Math.floor(Math.random() * adj[a].length)], t: Math.random(), s: 0.006 + Math.random() * 0.012 });
    }
    const pulsePos = new Float32Array(pulses.length * 3);
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
    const pulseMat = new THREE.PointsMaterial({ size: 0.34, map: dotTex, color: ACCENT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    group.add(new THREE.Points(pulseGeo, pulseMat));

    // interaction state
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let scrollP = 0;
    let running = true;
    let boost = 0;

    window.addEventListener('pointermove', (e) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    hero.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a, button')) return;
      boost = 1; // click = traffic spike
    });

    if (HAS_GSAP) {
      ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onUpdate: (s) => { scrollP = s.progress; } });
    }

    function resize() {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w < 760 ? 19 : 16;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    new IntersectionObserver(([en]) => { running = en.isIntersecting; }).observe(hero);

    let angle = 0;
    const tmp = new THREE.Vector3();
    function frame() {
      requestAnimationFrame(frame);
      if (!running) return;
      boost *= 0.97;
      angle += 0.0012 + boost * 0.01;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      group.rotation.y = angle + mouse.x * 0.45;
      group.rotation.x = mouse.y * 0.25 + scrollP * 0.6;
      group.position.y = scrollP * 4;
      camera.position.z = (window.innerWidth < 760 ? 19 : 16) - scrollP * 5;

      pulses.forEach((p, i) => {
        p.t += p.s * (1 + boost * 5);
        if (p.t >= 1) {
          p.t = 0;
          p.a = p.b;
          const nb = adj[p.a];
          p.b = nb[Math.floor(Math.random() * nb.length)];
        }
        tmp.copy(nodes[p.a]).lerp(nodes[p.b], p.t);
        pulsePos[i * 3] = tmp.x;
        pulsePos[i * 3 + 1] = tmp.y;
        pulsePos[i * 3 + 2] = tmp.z;
      });
      pulseGeo.attributes.position.needsUpdate = true;
      lineMat.opacity = 0.1 + boost * 0.25;
      renderer.render(scene, camera);
    }
    if (RM) { renderer.render(scene, camera); } else frame();
  }

  function initCursor() {
    if (!FINE) return;
    root.classList.add('has-cursor');
    const dot = $('#cursorDot');
    const ring = $('#cursorRing');
    const label = $('#cursorLabel');
    gsap.set([dot, ring], { x: -100, y: -100 });
    const dx = gsap.quickTo(dot, 'x', { duration: 0.08 });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

    window.addEventListener('pointermove', (e) => {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    }, { passive: true });

    document.addEventListener('pointerover', (e) => {
      const el = e.target.closest('a, button, [data-cursor]');
      ring.classList.remove('is-hover', 'is-label');
      if (!el) return;
      if (el.dataset.cursor) {
        label.textContent = el.dataset.cursor;
        ring.classList.add('is-label');
      } else ring.classList.add('is-hover');
    });
    document.addEventListener('pointerdown', () => ring.classList.add('is-down'));
    document.addEventListener('pointerup', () => ring.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => gsap.to([dot, ring], { opacity: 0, duration: 0.2 }));
    document.addEventListener('mouseenter', () => gsap.to([dot, ring], { opacity: 1, duration: 0.2 }));
  }

  function initMagnetic() {
    if (!FINE || RM) return;
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  function initTilt() {
    if (!FINE) return;
    $$('[data-tilt]').forEach((card) => {
      const rX = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' });
      const rY = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', px * 100 + '%');
        card.style.setProperty('--my', py * 100 + '%');
        if (!RM) { rY((px - 0.5) * 14); rX((0.5 - py) * 14); }
      });
      card.addEventListener('pointerleave', () => { rX(0); rY(0); });
    });
  }

  function initChrome() {
    const nav = $('#nav');
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        nav.classList.toggle('is-scrolled', y > 40);
        nav.classList.toggle('is-hidden', self.direction === 1 && y > 300);
      },
    });
    gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
  }

  function initMarquee() {
    if (RM) return;
    const loops = [];
    $$('.mq-row').forEach((row) => {
      const track = $('.mq-track', row);
      const dir = Number(row.dataset.dir) || 1;
      loops.push({
        el: track,
        tw: gsap.fromTo(track, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 30, ease: 'none', repeat: -1 }),
      });
    });
    const cm = $('.cm-track');
    if (cm) loops.push({ el: cm, tw: gsap.to(cm, { xPercent: -50, duration: 16, ease: 'none', repeat: -1 }) });

    // scroll velocity → speed + skew
    let v = 0;
    const skews = loops.map((l) => gsap.quickTo(l.el, 'skewX', { duration: 0.4, ease: 'power3' }));
    gsap.ticker.add(() => {
      const target = lenis ? lenis.velocity : 0;
      v += (target - v) * 0.1;
      const speed = 1 + Math.min(Math.abs(v) / 6, 5);
      loops.forEach((l, i) => {
        l.tw.timeScale(speed);
        skews[i](Math.max(-10, Math.min(10, -v * 0.35)));
      });
    });
  }

  function initReveals() {
    // statement: word-by-word highlight tied to scroll
    $$('[data-scrub]').forEach((el) => {
      splitWords(el, 'sw');
      if (RM) return;
      gsap.fromTo($$('.sw', el), { opacity: 0.14 }, {
        opacity: 1,
        stagger: 0.08,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
      });
    });

    // big titles: masked word rise
    $$('[data-split-words]').forEach((el) => {
      splitWords(el, 'w');
      if (RM) return;
      gsap.from($$('.w > span', el), {
        yPercent: 110,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.045,
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });

    if (RM) return;

    // generic fade-up
    gsap.set('[data-reveal]', { y: 50, opacity: 0 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%',
      once: true,
      onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, stagger: 0.1, duration: 1, ease: 'power3.out' }),
    });

    // metrics
    gsap.from('.metric', {
      y: 90, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: '.metric-grid', start: 'top 85%' },
    });
    gsap.from('.m-bars i', {
      scaleX: 0, duration: 1.4, ease: 'expo.out', stagger: 0.06,
      scrollTrigger: { trigger: '.metric-grid', start: 'top 75%' },
    });
    $$('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count);
      const k = el.dataset.format === 'k';
      const o = { v: 0 };
      const render = () => {
        const val = o.v;
        el.textContent = k && val >= 1000 ? (val / 1000).toFixed(val >= target ? 0 : 1).replace(/\.0$/, '') + 'K' : Math.round(val);
      };
      render();
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => gsap.to(o, { v: target, duration: 2.2, ease: 'power3.out', onUpdate: render }),
      });
    });

    // education cards
    gsap.from('.edu', {
      y: 80, opacity: 0, rotate: (i) => (i ? 3 : -3), duration: 1.1, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '.edu-grid', start: 'top 85%' },
    });

    // terminal window
    gsap.from('#term', {
      y: 80, rotateX: 12, opacity: 0, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: '#term', start: 'top 88%' },
    });
  }

  function initExperience() {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1000px) and (min-height: 680px)', () => {
      if (RM) return undefined;
      root.classList.add('has-hscroll');
      const track = $('#expTrack');
      const dist = () => track.scrollWidth - window.innerWidth;
      const bar = $('#expProgress');
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: '#experience',
          start: 'top top',
          end: () => '+=' + dist(),
          pin: '.exp-pin',
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
        },
      });
      $$('.job', track).forEach((job) => {
        gsap.from($$('.job-list li', job), {
          x: 120, opacity: 0, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: job, containerAnimation: tween, start: 'left 90%', end: 'left 35%', scrub: true },
        });
        gsap.fromTo($('.job-idx', job), { xPercent: 40 }, {
          xPercent: -40, ease: 'none',
          scrollTrigger: { trigger: job, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        });
      });
      return () => root.classList.remove('has-hscroll');
    });
    mm.add('(max-width: 999px), (max-height: 679px)', () => {
      if (RM) return;
      $$('.job').forEach((job) => {
        gsap.from(job, { y: 70, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: job, start: 'top 88%' } });
      });
    });
  }

  function initPhysics() {
    const pg = $('#playground');
    if (!window.Matter || !pg || RM) return;
    const { Engine, Runner, Bodies, Composite, Body, Mouse, MouseConstraint, Events } = Matter;

    pg.classList.add('is-physics');
    const pills = $$('.pill', pg);
    const hint = $('#pgHint');
    if (!FINE && hint) hint.textContent = 'Tap to bounce my stack ✦';

    let W = pg.clientWidth;
    let H = pg.clientHeight;
    const T = 400;
    const engine = Engine.create();
    engine.gravity.y = 1;
    const world = engine.world;

    const ground = Bodies.rectangle(W / 2, H + T / 2, W * 4, T, { isStatic: true });
    const left = Bodies.rectangle(-T / 2, 0, T, H * 6, { isStatic: true });
    const right = Bodies.rectangle(W + T / 2, 0, T, H * 6, { isStatic: true });
    const ceil = Bodies.rectangle(W / 2, -H * 2 - T / 2, W * 4, T, { isStatic: true });
    Composite.add(world, [ground, left, right, ceil]);

    const items = pills.map((el) => ({ el, w: el.offsetWidth, h: el.offsetHeight, body: null }));

    let mouse = null;
    if (FINE) {
      mouse = Mouse.create(pg);
      // let the page keep scrolling over the playground
      mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
      mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
      mouse.element.removeEventListener('wheel', mouse.mousewheel);
      const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, damping: 0.1, render: { visible: false } } });
      Composite.add(world, mc);
      Events.on(mc, 'startdrag', () => { if (hint) gsap.to(hint, { opacity: 0, duration: 0.4 }); });
      pg.addEventListener('mouseleave', () => { mouse.button = -1; });
    } else {
      pg.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const r = pg.getBoundingClientRect();
        const px = e.clientX - r.left;
        const py = e.clientY - r.top;
        items.forEach(({ body }) => {
          if (!body) return;
          const dx = body.position.x - px;
          const dy = body.position.y - py;
          const d = Math.max(Math.hypot(dx, dy), 30);
          if (d < 260) Body.setVelocity(body, { x: (dx / d) * 14, y: (dy / d) * 14 - 8 });
        });
      });
    }

    function render() {
      items.forEach(({ el, w, h, body }) => {
        if (!body) return;
        el.style.transform = `translate(${body.position.x - w / 2}px, ${body.position.y - h / 2}px) rotate(${body.angle}rad)`;
      });
    }

    const runner = Runner.create();
    let started = false;
    let visible = false;

    function drop() {
      if (started) return;
      started = true;
      Runner.run(runner, engine);
      gsap.ticker.add(render);
      items.forEach((it, i) => {
        setTimeout(() => {
          it.w = it.el.offsetWidth;
          it.h = it.el.offsetHeight;
          const x = it.w / 2 + Math.random() * Math.max(1, W - it.w);
          it.body = Bodies.rectangle(x, -it.h - Math.random() * 120, it.w, it.h, {
            chamfer: { radius: it.h / 2 },
            restitution: 0.55,
            friction: 0.08,
            frictionAir: 0.012,
            density: 0.002,
            angle: (Math.random() - 0.5) * 0.8,
          });
          Composite.add(world, it.body);
          it.el.classList.add('is-live');
        }, i * 90);
      });
    }

    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) drop();
      if (started) runner.enabled = visible;
    }, { threshold: 0.35 }).observe(pg);

    $('#pgShake').addEventListener('click', () => {
      drop();
      items.forEach(({ body }) => {
        if (body) Body.setVelocity(body, { x: (Math.random() - 0.5) * 30, y: -12 - Math.random() * 16 });
        if (body) Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.4);
      });
    });

    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        W = pg.clientWidth;
        H = pg.clientHeight;
        Body.setPosition(ground, { x: W / 2, y: H + T / 2 });
        Body.setPosition(right, { x: W + T / 2, y: 0 });
        Body.setPosition(ceil, { x: W / 2, y: -H * 2 - T / 2 });
        items.forEach(({ body, w }) => {
          if (body && body.position.x > W - w / 2) Body.setPosition(body, { x: W - w / 2, y: body.position.y - 60 });
        });
      }, 150);
    });
  }

  /* ───────────────────────────── boot ───────────────────────────── */

  initClock();
  initNavText();
  initCopy();
  initTerminal();

  if (!HAS_GSAP) {
    // libraries failed to load: show the plain page
    const pl = $('#preloader');
    if (pl) pl.remove();
    initAnchors();
    initRoles();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  initLenis();
  initAnchors();
  initHero();
  initNetwork();
  initCursor();
  initMagnetic();
  initTilt();
  initChrome();
  initMarquee();
  initExperience();
  initReveals();
  initPhysics();

  preloader(() => {
    heroIntro();
    initRoles();
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
