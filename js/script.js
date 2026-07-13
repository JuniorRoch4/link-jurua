/* Reveal ao rolar + leve parallax na imagem de fundo do hero */
(function () {
  // Header: badges com efeito de vidro só aparecem depois que a página é rolada
  const header = document.querySelector('.site-header');
  if (header) {
    const updateHeader = () => {
      header.classList.toggle('site-header--scrolled', window.scrollY > 40);
    };
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  // Menu lateral (hamburguer discreto)
  const menuToggle = document.getElementById('menuToggle');
  const sideMenu = document.getElementById('siteMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  if (menuToggle && sideMenu && menuOverlay) {
    const closeMenu = () => {
      sideMenu.classList.remove('is-open');
      menuOverlay.classList.remove('is-visible');
      menuOverlay.hidden = true;
      menuToggle.setAttribute('aria-expanded', 'false');
    };
    const openMenu = () => {
      sideMenu.classList.add('is-open');
      menuOverlay.hidden = false;
      requestAnimationFrame(() => menuOverlay.classList.add('is-visible'));
      menuToggle.setAttribute('aria-expanded', 'true');
    };
    menuToggle.addEventListener('click', () => {
      const isOpen = sideMenu.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    });
    menuOverlay.addEventListener('click', closeMenu);
    sideMenu.querySelectorAll('.side-menu__link').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  const revealTargets = document.querySelectorAll(
    '.section-title, .product-card, .benefit-card, .review-card, .about__inner, .highlights'
  );
  revealTargets.forEach((el) => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => observer.observe(el));

  // Parallax da imagem de fundo do hero: apenas vertical, limitado para
  // nunca deslocar a foto além das bordas
  const heroBg = document.querySelector('.hero__bg');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const y = Math.min(window.scrollY * 0.08, 40);
      heroBg.style.transform = `scale(1.06) translateY(${y}px)`;
    }, { passive: true });
  }
})();
