/*
  Efeito "3D" orgânico do hero: camadas de bolhas/folhas com profundidade
  sobre a foto de fundo. Parallax em UMA direção só (vertical) — reage ao
  mouse (desktop), à rolagem e ao giroscópio (mobile).
*/
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = document.getElementById('hero');

  let width, height, dpr;
  let pointer = { y: 0 };      // -1..1, alvo (apenas eixo vertical)
  let pointerEased = { y: 0 }; // valor suavizado
  let particles = [];
  let reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildParticles();
  }

  function buildParticles() {
    const count = width < 640 ? 18 : 32;
    particles = [];
    for (let i = 0; i < count; i++) {
      const depth = Math.random(); // 0 = longe, 1 = perto
      const isLeaf = Math.random() < 0.35;
      particles.push({
        baseX: Math.random() * width,
        baseY: Math.random() * height,
        depth,
        r: isLeaf ? 10 + depth * 22 : 6 + depth * 34,
        isLeaf,
        hue: Math.random() < 0.5 ? 'green' : 'cream',
        drift: Math.random() * Math.PI * 2,
        driftSpeed: 0.15 + Math.random() * 0.25,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        floatAmp: 10 + Math.random() * 26,
      });
    }
  }

  function drawBlob(p, x, y, t) {
    const wob = Math.sin(t * 0.6 + p.drift) * (p.r * 0.12);
    ctx.beginPath();
    ctx.ellipse(x, y, p.r + wob, p.r * 0.92 - wob, p.rot, 0, Math.PI * 2);
    const alpha = 0.10 + p.depth * 0.22;
    // tons claros — desenhados apenas sobre a foto escura do hero
    if (p.hue === 'green') {
      ctx.fillStyle = `rgba(156,191,63,${alpha})`;
    } else {
      ctx.fillStyle = `rgba(250,246,231,${alpha * 1.1})`;
    }
    ctx.fill();
  }

  function drawLeaf(p, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(p.rot + Math.sin(t * 0.3 + p.drift) * 0.2);
    const alpha = 0.14 + p.depth * 0.28;
    ctx.fillStyle = `rgba(124,145,67,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, -p.r);
    ctx.quadraticCurveTo(p.r * 0.9, 0, 0, p.r);
    ctx.quadraticCurveTo(-p.r * 0.9, 0, 0, -p.r);
    ctx.fill();
    ctx.restore();
  }

  let t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;

    pointerEased.y += (pointer.y - pointerEased.y) * 0.06;

    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      const floatY = Math.sin(t * p.driftSpeed + p.drift) * p.floatAmp;
      // profundidade: camadas mais "perto" deslocam mais — apenas no eixo vertical
      const parallaxStrength = 22 + p.depth * 58;
      const x = p.baseX;
      const y = p.baseY + floatY + pointerEased.y * parallaxStrength;

      if (p.isLeaf) drawLeaf(p, x, y, t);
      else drawBlob(p, x, y, t);
    }

    requestAnimationFrame(frame);
  }

  function setPointerFromY(clientY) {
    const ny = (clientY / window.innerHeight) * 2 - 1;
    pointer.y = Math.max(-1, Math.min(1, ny));
  }

  // Desktop: posição vertical do mouse
  window.addEventListener('mousemove', (e) => {
    setPointerFromY(e.clientY);
  }, { passive: true });

  // Mobile: rolagem dentro do hero controla a profundidade (uma direção, previsível)
  window.addEventListener('scroll', () => {
    const max = hero.clientHeight;
    if (max > 0) {
      pointer.y = Math.max(-1, Math.min(1, (window.scrollY / max) * 2 - 1));
    }
  }, { passive: true });

  // Mobile: inclinar o aparelho (giroscópio) — apenas inclinação frente/trás
  let gyroEnabled = false;
  function enableGyro() {
    if (gyroEnabled) return;
    gyroEnabled = true;
    window.addEventListener('deviceorientation', (e) => {
      if (e.beta == null) return;
      pointer.y = Math.max(-1, Math.min(1, (e.beta - 40) / 30));
    }, true);
  }

  function requestGyroIfNeeded() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then((state) => {
        if (state === 'granted') enableGyro();
      }).catch(() => {});
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
      enableGyro();
    }
  }
  window.addEventListener('touchstart', requestGyroIfNeeded, { once: true, passive: true });

  window.addEventListener('resize', resize);
  resize();

  if (!reduceMotion) {
    requestAnimationFrame(frame);
  } else {
    // ainda desenha uma vez, parado, respeitando prefers-reduced-motion
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      if (p.isLeaf) drawLeaf(p, p.baseX, p.baseY, 0);
      else drawBlob(p, p.baseX, p.baseY, 0);
    }
  }
})();
