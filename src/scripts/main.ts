const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (!reducedMotion.matches && typeof Element.prototype.animate === 'function') {
  const animations = Array.from(document.querySelectorAll<HTMLElement>('[data-enter]'), (element, index) =>
    element.animate(
      [ { opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' } ],
      { duration: 260, delay: Math.min(index, 5) * 35, easing: 'ease-out', fill: 'backwards' },
    ),
  );

  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) animations.forEach((animation) => animation.cancel());
  });
}
