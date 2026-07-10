/*
  Efeito "3D" orgânico: camadas de bolhas/folhas com profundidade sobre
  seções com foto de fundo. Parallax em UMA direção só (vertical) — reage
  ao mouse (desktop), à rolagem e ao giroscópio (mobile).
  Aplica-se a todo <canvas class="depth-canvas"> dentro de uma seção.
*/
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scenes = [];

  function createScene(canvas) {
    const ctx = canvas.getContext('2d');
    const container = canvas.closest('section') || canvas.parentElement;

    const scene = {
      canvas, ctx, container,
      width: 0, height: 0,
      pointer: { y: 0 },
      pointerEased: { y: 0 },
      particles: [],
    };

    scene.resize = function () {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      scene.width = container.clientWidth;
      scene.height = container.clientHeight;
      canvas.width = scene.width * dpr;
      canvas.height = scene.height * dpr;
      canvas.style.width = scene.width + 'px';
      canvas.style.height = scene.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles(scene);
    };

    scene.resize();
    return scene;
  }

  function buildParticles(scene) {
    const count = scene.width < 640 ? 14 : 26;
    scene.particles = [];
    for (let i = 0; i < count; i++) {
      const depth = Math.random(); // 0 = longe, 1 = perto
      const isLeaf = Math.random() < 0.35;
      scene.particles.push({
        baseX: Math.random() * scene.width,
        baseY: Math.random() * scene.height,
        depth,
        r: isLeaf ? 10 + depth * 22 : 6 + depth * 34,
        isLeaf,
        hue: Math.random() < 0.5 ? 'green' : 'cream',
        drift: Math.random() * Math.PI * 2,
        driftSpeed: 0.15 + Math.random() * 0.25,
        rot: Math.random() * Math.PI * 2,
        floatAmp: 10 + Math.random() * 26,
      });
    }
  }

  function drawBlob(ctx, p, x, y, t) {
    const wob = Math.sin(t * 0.6 + p.drift) * (p.r * 0.12);
    ctx.beginPath();
    ctx.ellipse(x, y, p.r + wob, p.r * 0.92 - wob, p.rot, 0, Math.PI * 2);
    const alpha = 0.10 + p.depth * 0.22;
    // tons claros — desenhados apenas sobre fundos escuros
    if (p.hue === 'green') {
      ctx.fillStyle = `rgba(156,191,63,${alpha})`;
    } else {
      ctx.fillStyle = `rgba(250,246,231,${alpha * 1.1})`;
    }
    ctx.fill();
  }

  function drawLeaf(ctx, p, x, y, t) {
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

  function drawScene(scene, t) {
    const { ctx } = scene;
    scene.pointerEased.y += (scene.pointer.y - scene.pointerEased.y) * 0.06;
    ctx.clearRect(0, 0, scene.width, scene.height);
    for (const p of scene.particles) {
      const floatY = Math.sin(t * p.driftSpeed + p.drift) * p.floatAmp;
      // profundidade: camadas mais "perto" deslocam mais — apenas no eixo vertical
      const parallaxStrength = 22 + p.depth * 58;
      const y = p.baseY + floatY + scene.pointerEased.y * parallaxStrength;
      if (p.isLeaf) drawLeaf(ctx, p, p.baseX, y, t);
      else drawBlob(ctx, p, p.baseX, y, t);
    }
  }

  let t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;
    for (const scene of scenes) drawScene(scene, t);
    requestAnimationFrame(frame);
  }

  // Rolagem: profundidade segue a posição da seção na tela (uma direção, previsível)
  function updateFromScroll() {
    for (const scene of scenes) {
      const rect = scene.container.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      const range = window.innerHeight / 2 + rect.height / 2;
      scene.pointer.y = Math.max(-1, Math.min(1, -center / range));
    }
  }
  window.addEventListener('scroll', updateFromScroll, { passive: true });

  // Desktop: posição vertical do mouse dentro da seção
  window.addEventListener('mousemove', (e) => {
    for (const scene of scenes) {
      const rect = scene.container.getBoundingClientRect();
      if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        scene.pointer.y = Math.max(-1, Math.min(1, ny));
      }
    }
  }, { passive: true });

  // Mobile: inclinar o aparelho (giroscópio) — apenas inclinação frente/trás
  let gyroEnabled = false;
  function enableGyro() {
    if (gyroEnabled) return;
    gyroEnabled = true;
    window.addEventListener('deviceorientation', (e) => {
      if (e.beta == null) return;
      const ny = Math.max(-1, Math.min(1, (e.beta - 40) / 30));
      for (const scene of scenes) scene.pointer.y = ny;
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

  window.addEventListener('resize', () => {
    for (const scene of scenes) scene.resize();
  });

  document.querySelectorAll('canvas.depth-canvas').forEach((canvas) => {
    scenes.push(createScene(canvas));
  });

  if (!scenes.length) return;

  if (!reduceMotion) {
    updateFromScroll();
    requestAnimationFrame(frame);
  } else {
    // desenha uma vez, parado, respeitando prefers-reduced-motion
    for (const scene of scenes) drawScene(scene, 0);
  }
})();
