(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const M = window.Motion || null;
  const ANIM = !!M && !RM;
  const EMAIL = 'alfalahlazuardim@gmail.com';

  if (!ANIM) root.classList.add('no-anim');

  // Run fn once when el scrolls into view (falls back to immediately).
  const onView = (el, fn, amount = 0.35) => {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
    }, { threshold: amount });
    io.observe(el);
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  /* ── toast + copy ── */
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), 2000);
  }
  function copyEmail() {
    const btn = $('#copyBtn');
    const ok = () => {
      toast('Email copied ✓');
      btn.classList.add('done');
      setTimeout(() => btn.classList.remove('done'), 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(EMAIL).then(ok, () => toast(EMAIL));
    else toast(EMAIL);
  }
  $('#copyBtn').addEventListener('click', copyEmail);

  /* ── clock ── */
  const clock = $('#clock');
  const tf = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
  const tick = () => { clock.textContent = tf.format(new Date()); };
  tick();
  setInterval(tick, 20000);
  $('#year').textContent = new Date().getFullYear();

  /* ── theme (circular reveal via View Transitions) ── */
  function setTheme(next, x, y) {
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
    };
    if (!document.startViewTransition || RM) { apply(); return; }
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  }
  function toggleTheme(e) {
    const b = $('#themeBtn').getBoundingClientRect();
    const x = e && e.clientX ? e.clientX : b.left + b.width / 2;
    const y = e && e.clientY ? e.clientY : b.top + b.height / 2;
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', x, y);
  }
  $('#themeBtn').addEventListener('click', toggleTheme);

  /* ── spotlight that follows the pointer across all tiles ── */
  const tiles = $$('.tile');
  let raf = 0;
  let px = -999;
  let py = -999;
  window.addEventListener('pointermove', (e) => {
    px = e.clientX; py = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      tiles.forEach((t) => {
        const r = t.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        t.style.setProperty('--mx', px - r.left + 'px');
        t.style.setProperty('--my', py - r.top + 'px');
      });
    });
  }, { passive: true });

  /* ── active nav link ── */
  const navLinks = $$('.top-nav a');
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  ['about', 'experience', 'skills', 'contact'].forEach((id) => navIO.observe(document.getElementById(id)));

  /* ── hero: split name into letters ── */
  const heroName = $('#heroName');
  (function split(node) {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...n.textContent].forEach((c) => {
          if (c === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = 'ch';
          s.textContent = c;
          frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) split(n);
    });
  })(heroName);

  /* ── entrance animations ── */
  if (ANIM) {
    const { animate, stagger, inView } = M;
    animate($$('.ch', heroName), { y: [70, 0], rotate: [8, 0], opacity: [0, 1] }, { type: 'spring', bounce: 0.35, duration: 0.9, delay: stagger(0.035, { startDelay: 0.15 }) });

    tiles.forEach((t) => {
      inView(t, () => {
        const col = Math.round((t.getBoundingClientRect().left / innerWidth) * 4);
        animate(t, { opacity: [0, 1], y: [40, 0], scale: [0.96, 1] }, { type: 'spring', bounce: 0.25, duration: 0.8, delay: col * 0.06 });
      }, { amount: 0.12 });
    });

    $$('.ch', heroName).forEach((ch) => {
      ch.addEventListener('pointerenter', () => {
        animate(ch, { y: [0, -14, 0], rotate: [0, -8, 0] }, { duration: 0.5, ease: 'easeOut' });
      });
    });

    $('#avatar').addEventListener('click', (e) => {
      animate(e.currentTarget, { rotate: [0, 360], scale: [1, 1.18, 1] }, { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] });
    });
  }

  /* ── counters ── */
  $$('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const sep = el.hasAttribute('data-sep');
    const show = (v) => { el.textContent = sep ? fmt(v) : Math.round(v); };
    if (!ANIM) return;
    show(0);
    onView(el, () => M.animate(0, target, { duration: 1.8, ease: [0.16, 1, 0.3, 1], onUpdate: show }));
  });

  /* ── 12x race ── */
  (function race() {
    const tile = $('#race');
    const slow = $('.runner.slow', tile);
    const fast = $('.runner.fast', tile);
    let running = false;
    const run = async () => {
      if (running) return;
      running = true;
      slow.style.width = '0%';
      fast.style.width = '0%';
      if (!ANIM) { slow.style.width = '100%'; fast.style.width = '100%'; running = false; return; }
      M.animate(fast, { width: ['0%', '100%'] }, { duration: 0.25, ease: 'easeOut' });
      await M.animate(slow, { width: ['0%', '100%'] }, { duration: 3, ease: 'linear' });
      running = false;
    };
    tile.addEventListener('pointerenter', run);
    tile.addEventListener('focus', run);
    tile.addEventListener('click', run);
    onView(tile, run, 0.6);
  })();

  /* ── latency chart ── */
  (function latency() {
    const svg = $('#latChart');
    const line = $('#latLine');
    const area = $('#latArea');
    const deploy = $('#latDeploy');
    const guide = $('#latGuide');
    const dot = $('#latDot');
    const readout = $('#latReadout');
    const tile = svg.closest('.tile');

    // deterministic pseudo-random so the shape is stable between visits
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const N = 40;
    const DEPLOY = 24;
    const vals = [];
    for (let i = 0; i < N; i++) {
      let v = i < DEPLOY ? 100 + (rnd() - 0.5) * 14 : 40 + (rnd() - 0.5) * 7;
      if (i === DEPLOY) v = 62;
      vals.push(v);
    }
    const X = (i) => (i / (N - 1)) * 600;
    const Y = (v) => 140 - v * 1.2;
    const pts = vals.map((v, i) => [X(i), Y(v)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    line.setAttribute('d', d);
    area.setAttribute('d', d + ' L600 150 L0 150 Z');
    const dx = X(DEPLOY - 0.5);
    deploy.setAttribute('x1', dx);
    deploy.setAttribute('x2', dx);

    // draw-in via clip rect
    const NS = 'http://www.w3.org/2000/svg';
    const clip = document.createElementNS(NS, 'clipPath');
    clip.id = 'latClip';
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', '-10');
    rect.setAttribute('y', '-10');
    rect.setAttribute('height', '170');
    rect.setAttribute('width', ANIM ? '0' : '620');
    clip.appendChild(rect);
    svg.querySelector('defs').appendChild(clip);
    line.setAttribute('clip-path', 'url(#latClip)');
    area.setAttribute('clip-path', 'url(#latClip)');
    if (ANIM) {
      onView(svg, () => {
        M.animate(0, 620, { duration: 1.6, ease: [0.65, 0, 0.35, 1], onUpdate: (w) => rect.setAttribute('width', w) });
      }, 0.5);
    }

    svg.addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const i = Math.round(f * (N - 1));
      const [x, y] = pts[i];
      guide.setAttribute('x1', x);
      guide.setAttribute('x2', x);
      const tr = tile.getBoundingClientRect();
      dot.style.left = r.left - tr.left + (x / 600) * r.width + 'px';
      dot.style.top = r.top - tr.top + (y / 150) * r.height + 'px';
      dot.classList.add('on');
      const pct = Math.round(vals[i]);
      readout.innerHTML = i < DEPLOY
        ? `before · <b>${pct}%</b> of baseline`
        : `after · <b style="color:var(--blue)">${pct}%</b> of baseline`;
    });
    svg.addEventListener('pointerleave', () => {
      dot.classList.remove('on');
      readout.textContent = 'hover the chart';
    });
  })();

  /* ── import dots ── */
  (function importer() {
    const grid = $('#dots');
    const btn = $('#importBtn');
    const count = $('#importCount');
    const TOTAL = 250; // 1 dot = 12 records
    const BEFORE = 17; // ≈ 200 records
    for (let i = 0; i < TOTAL; i++) grid.appendChild(document.createElement('i'));
    const dots = [...grid.children];
    const showAll = () => { dots.forEach((d) => d.classList.add('on')); count.textContent = '3,000'; };
    if (!ANIM) { showAll(); btn.hidden = true; return; }

    let busy = false;
    async function run() {
      if (busy) return;
      busy = true;
      btn.disabled = true;
      btn.textContent = 'importing…';
      dots.forEach((d) => d.classList.remove('on', 'b'));
      count.textContent = '0';
      // before: synchronous, N+1 → slow trickle, stops at 200
      for (let i = 0; i < BEFORE; i++) {
        dots[i].classList.add('b');
        count.textContent = fmt(((i + 1) / BEFORE) * 200);
        await sleep(55);
      }
      await sleep(350);
      // after: queued + batched → fast fill to 3,000
      const t0 = performance.now();
      const dur = 1100;
      await new Promise((resolve) => {
        const step = (now) => {
          const p = Math.min(1, (now - t0) / dur);
          const n = Math.floor(p * TOTAL);
          for (let i = 0; i < n; i++) dots[i].classList.add('on');
          count.textContent = fmt(200 + p * 2800);
          if (p < 1) requestAnimationFrame(step); else resolve();
        };
        requestAnimationFrame(step);
      });
      count.textContent = '3,000';
      btn.textContent = '↻ Run again';
      btn.disabled = false;
      busy = false;
    }
    btn.addEventListener('click', run);
    onView(grid, run, 0.6);
  })();

  /* ── delivery ring ── */
  (function ring() {
    const r = $('#ring');
    if (!ANIM) return;
    r.style.strokeDasharray = '0 100';
    onView(r, () => M.animate(0, 95, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => { r.style.strokeDasharray = `${v} 100`; } }));
  })();

  /* ── experience tabs + timeline ── */
  (function experience() {
    const tile = $('.t-exp');
    tile.classList.add('js-tabs');
    const tabs = $$('.exp-tab', tile);
    const panels = $$('.exp-panel', tile);
    const segs = $$('.tl-seg', tile);
    let current = -1;

    function activate(i, focus) {
      if (i === current) return;
      current = i;
      tabs.forEach((t) => {
        const on = Number(t.dataset.job) === i;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      segs.forEach((s) => s.classList.toggle('is-on', Number(s.dataset.job) === i));
      panels.forEach((p) => {
        const on = Number(p.dataset.job) === i;
        p.classList.toggle('is-on', on);
        if (on && ANIM) {
          M.animate(p, { opacity: [0, 1], x: [18, 0] }, { duration: 0.4, ease: 'easeOut' });
          M.animate($$('li', p), { opacity: [0, 1], y: [10, 0] }, { duration: 0.35, delay: M.stagger(0.05, { startDelay: 0.08 }) });
        }
      });
    }

    tabs.forEach((t) => t.addEventListener('click', () => activate(Number(t.dataset.job))));
    segs.forEach((s) => s.addEventListener('click', () => activate(Number(s.dataset.job))));
    $('.exp-tabs', tile).addEventListener('keydown', (e) => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
      activate((current + dir + tabs.length) % tabs.length, true);
    });
    activate(0);
  })();

  /* ── AI terminal loop ── */
  (function aiTerm() {
    const pre = $('#aiTerm');
    const script = [
      ['p', '› why is GET /offers slow?'],
      ['', '  profiling offer filter…'],
      ['', '  nested loop over offers × rules'],
      ['', '  complexity: O(n²)'],
      ['p', '› sort rules + binary search'],
      ['', '  refactor applied, tests green'],
      ['ok', '  O(n log n) ✓'],
      ['ok', '  throughput 12× ↑'],
      ['p', '› ship it'],
    ];
    if (!ANIM) {
      pre.innerHTML = script.map(([c, t]) => `<span class="${c}">${t}</span>`).join('\n');
      return;
    }
    let started = false;
    async function loop() {
      for (;;) {
        pre.innerHTML = '';
        for (const [cls, text] of script) {
          const span = document.createElement('span');
          span.className = cls;
          pre.appendChild(span);
          const cur = document.createElement('i');
          cur.className = 'cur';
          pre.appendChild(cur);
          const typed = cls === 'p';
          for (let i = 1; i <= text.length; i++) {
            span.textContent = text.slice(0, i);
            if (typed) await sleep(28 + Math.random() * 40);
          }
          if (!typed) await sleep(260);
          cur.remove();
          pre.appendChild(document.createTextNode('\n'));
          await sleep(typed ? 420 : 160);
        }
        const cur = document.createElement('i');
        cur.className = 'cur';
        pre.appendChild(cur);
        await sleep(3200);
      }
    }
    onView(pre, () => { if (!started) { started = true; loop(); } }, 0.4);
  })();

  /* ── skills filter ── */
  (function skills() {
    const btns = $$('.filter');
    const tags = $$('.sk');
    btns.forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.f;
      btns.forEach((x) => x.classList.toggle('is-on', x === b));
      const hits = [];
      tags.forEach((t) => {
        const on = f === 'all' || t.dataset.l === f;
        t.classList.toggle('is-dim', !on);
        if (on) hits.push(t);
      });
      if (ANIM && f !== 'all') M.animate(hits, { scale: [0.85, 1.08, 1] }, { duration: 0.45, delay: M.stagger(0.03) });
    }));
  })();

  /* ── command palette ── */
  (function palette() {
    const dlg = $('#palette');
    const input = $('#palInput');
    const list = $('#palList');
    const go = (id) => () => document.getElementById(id).scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    const actions = [
      { icon: '👋', label: 'About me', hint: 'section', run: go('about'), k: 'about bio intro' },
      { icon: '💼', label: 'Work experience', hint: 'section', run: go('experience'), k: 'work jobs career experience code development stafbook solu' },
      { icon: '🧰', label: 'Technical skills', hint: 'section', run: go('skills'), k: 'skills stack golang node typescript' },
      { icon: '🎓', label: 'Education', hint: 'section', run: go('education'), k: 'education binus school' },
      { icon: '✉️', label: 'Contact', hint: 'section', run: go('contact'), k: 'contact hire email' },
      { icon: '📋', label: 'Copy email address', hint: 'action', run: copyEmail, k: 'copy email clipboard' },
      { icon: '📨', label: 'Send an email', hint: 'action', run: () => { location.href = 'mailto:' + EMAIL; }, k: 'mail send email hire' },
      { icon: '📞', label: 'Call +62 851 7300 9061', hint: 'action', run: () => { location.href = 'tel:+6285173009061'; }, k: 'phone call' },
      { icon: '🌓', label: 'Toggle dark mode', hint: 'action', run: () => toggleTheme(), k: 'theme dark light mode' },
      { icon: '⬆️', label: 'Back to top', hint: 'action', run: () => window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }), k: 'top home' },
    ];
    let shown = actions;
    let sel = 0;

    function render() {
      const q = input.value.trim().toLowerCase();
      shown = actions.filter((a) => !q || (a.label + ' ' + a.k).toLowerCase().includes(q));
      sel = Math.min(sel, Math.max(0, shown.length - 1));
      list.innerHTML = shown.length
        ? shown.map((a, i) => `<li role="option" data-i="${i}" class="${i === sel ? 'is-sel' : ''}" aria-selected="${i === sel}"><span class="pi">${a.icon}</span>${a.label}<span class="ps">${a.hint}</span></li>`).join('')
        : '<div class="pal-empty">No results — try “email” or “work”.</div>';
    }
    function open() {
      if (dlg.open) return;
      input.value = '';
      sel = 0;
      render();
      dlg.showModal();
      input.focus();
      if (ANIM) M.animate($('.pal-box', dlg), { opacity: [0, 1], scale: [0.96, 1], y: [-8, 0] }, { duration: 0.25, ease: 'easeOut' });
    }
    function exec(i) {
      const a = shown[i];
      if (!a) return;
      dlg.close();
      a.run();
    }

    $('#openPalette').addEventListener('click', open);
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : open(); }
      else if (e.key === '/' && !dlg.open && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    });
    input.addEventListener('input', () => { sel = 0; render(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, shown.length); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(1, shown.length); render(); }
      else if (e.key === 'Enter') { e.preventDefault(); exec(sel); }
    });
    list.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (li) exec(Number(li.dataset.i));
    });
    list.addEventListener('pointermove', (e) => {
      const li = e.target.closest('li');
      if (li && Number(li.dataset.i) !== sel) { sel = Number(li.dataset.i); render(); }
    });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  })();
})();
