/*
  Fundo "3D" orgânico do hero: camadas de bolhas/folhas com profundidade (parallax).
  Movimento contínuo (idle) + reação ao mouse (desktop) e ao toque/giroscópio (mobile).
*/
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = document.getElementById('hero');

  let width, height, dpr;
  let pointer = { x: 0, y: 0 };   // -1..1, alvo
  let pointerEased = { x: 0, y: 0 }; // valor suavizado
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

    pointerEased.x += (pointer.x - pointerEased.x) * 0.06;
    pointerEased.y += (pointer.y - pointerEased.y) * 0.06;

    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      const floatY = Math.sin(t * p.driftSpeed + p.drift) * p.floatAmp;
      const parallaxStrength = 26 + p.depth * 70; // camadas mais "perto" se movem mais -> ilusão de profundidade
      const x = p.baseX + pointerEased.x * parallaxStrength;
      const y = p.baseY + floatY + pointerEased.y * parallaxStrength * 0.6;

      if (p.isLeaf) drawLeaf(p, x, y, t);
      else drawBlob(p, x, y, t);
    }

    requestAnimationFrame(frame);
  }

  function setPointerFromEvent(clientX, clientY) {
    const rect = hero.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((clientY - rect.top) / rect.height) * 2 - 1;
    pointer.x = Math.max(-1, Math.min(1, nx));
    pointer.y = Math.max(-1, Math.min(1, ny));
  }

  // Desktop: movimento do mouse
  window.addEventListener('mousemove', (e) => {
    setPointerFromEvent(e.clientX, e.clientY);
  }, { passive: true });

  // Mobile: arrastar o dedo pela tela
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      setPointerFromEvent(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  // Mobile: inclinar o aparelho (giroscópio)
  let gyroEnabled = false;
  function enableGyro() {
    if (gyroEnabled) return;
    gyroEnabled = true;
    window.addEventListener('deviceorientation', (e) => {
      if (e.beta == null || e.gamma == null) return;
      const nx = Math.max(-1, Math.min(1, e.gamma / 30));
      const ny = Math.max(-1, Math.min(1, (e.beta - 40) / 30));
      pointer.x = nx;
      pointer.y = ny;
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
