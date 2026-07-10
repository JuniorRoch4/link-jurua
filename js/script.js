/* Reveal ao rolar + leve parallax na imagem de fundo do hero */
(function () {
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
