(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-copy-email]').forEach(link => {
    const marker = link.querySelector('[data-copy-mark]');
    const status = document.querySelector('[data-copy-status]');
    let restoreTimer;
    link.addEventListener('keydown', event => {
      if (event.key === ' ') { event.preventDefault(); link.click(); }
    });
    link.addEventListener('click', async event => {
      event.preventDefault();
      let copied = false;
      try { await navigator.clipboard.writeText(link.dataset.copyEmail); copied = true; } catch (_) {}
      if (!copied) {
        const field = document.createElement('textarea');
        field.value = link.dataset.copyEmail;
        field.setAttribute('readonly', '');
        field.style.cssText = 'position:fixed;left:-9999px;opacity:0';
        document.body.appendChild(field);
        field.select();
        try { copied = document.execCommand('copy'); } catch (_) {}
        field.remove();
        link.focus({ preventScroll: true });
      }
      if (marker) marker.textContent = copied ? '✓' : '⧉';
      if (status) status.textContent = copied ? 'Email address copied.' : 'You can select and copy the email address.';
      window.clearTimeout(restoreTimer);
      restoreTimer = window.setTimeout(() => {
        if (marker) marker.textContent = '⧉';
        if (status) status.textContent = '';
      }, 2200);
    });
  });

  const progress = document.querySelector('[data-reading-progress]');
  const trail = document.querySelector('[data-space-trail]');
  const walker = document.querySelector('[data-space-return]');
  const percent = document.querySelector('[data-space-percent]');
  const masthead = document.querySelector('.masthead');
  const compact = window.matchMedia('(max-width: 1199px)');
  if (!trail || !walker) return;
  let pending = false;
  let lastY = window.scrollY;
  let lastTime = performance.now();
  let straighten;
  const update = () => {
    const total = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const fraction = total ? Math.max(0, Math.min(1, window.scrollY / total)) : 0;
    if (progress) progress.style.transform = `scaleX(${fraction})`;
    if (percent) percent.textContent = `${Math.round(fraction * 100)}%`;
    const now = performance.now();
    const velocity = (window.scrollY - lastY) / Math.max(16, now - lastTime);
    lastY = window.scrollY;
    lastTime = now;
    const tilt = motion.matches ? 0 : Math.max(-18, Math.min(18, velocity * 5));
    walker.style.setProperty('--space-tilt', `${tilt.toFixed(1)}deg`);
    clearTimeout(straighten);
    if (tilt) straighten = setTimeout(() => walker.style.setProperty('--space-tilt', '0deg'), 180);
    trail.classList.toggle('is-landed', fraction >= .995);
    trail.classList.toggle('has-progress', fraction > .025);
    walker.hidden = compact.matches && fraction <= .025;
    if (compact.matches) {
      trail.style.setProperty('--space-top', `${(masthead?.getBoundingClientRect().bottom || 76) - 10}px`);
      walker.style.transform = `translate3d(${10 + fraction * Math.max(0, window.innerWidth - 46)}px, 0, 0)`;
    } else {
      walker.style.transform = `translate3d(0, ${fraction * Math.max(0, trail.clientHeight - walker.offsetHeight)}px, 0)`;
    }
    pending = false;
  };
  const schedule = () => {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  compact.addEventListener('change', schedule);
  motion.addEventListener('change', schedule);
  new ResizeObserver(schedule).observe(document.body);
  walker.addEventListener('click', () => window.scrollTo({ top: 0, behavior: motion.matches ? 'auto' : 'smooth' }));
  update();
})();
