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
  const rocket = document.querySelector('[data-space-return]');
  const percent = document.querySelector('[data-space-percent]');
  const state = document.querySelector('[data-space-state]');
  const content = document.querySelector('.page__content, .archive');
  const compact = window.matchMedia('(max-width: 1199px)');
  if (!trail || !rocket) return;
  let pending = false;
  let lastY = window.scrollY;
  let lastTime = performance.now();
  let settleTimer;
  let small = false;
  const layout = () => {
    const gutter = content ? window.innerWidth - content.getBoundingClientRect().right : 0;
    small = compact.matches || gutter < 90 || window.innerHeight < 650;
    trail.classList.toggle('is-compact', small);
    schedule();
  };
  const update = () => {
    const total = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const fraction = total ? Math.max(0, Math.min(1, window.scrollY / total)) : 0;
    const now = performance.now();
    const velocity = (window.scrollY - lastY) / Math.max(16, now - lastTime);
    const changed = Math.abs(window.scrollY - lastY) > .5;
    lastY = window.scrollY;
    lastTime = now;
    if (progress) progress.style.transform = `scaleX(${fraction})`;
    if (percent) percent.textContent = `${Math.round(fraction * 100)}%`;
    const grounded = fraction <= .004;
    const orbit = fraction >= .996;
    const descending = velocity < 0;
    trail.classList.toggle('has-progress', fraction > .025);
    trail.classList.toggle('is-grounded', grounded);
    trail.classList.toggle('is-orbit', orbit);
    rocket.hidden = small && fraction <= .025;
    rocket.style.transform = `translate3d(0, ${small ? 22 * (1 - fraction) : (1 - fraction) * Math.max(0, trail.clientHeight - rocket.offsetHeight + 16)}px, 0)`;
    const tilt = motion.matches ? 0 : Math.max(-7, Math.min(7, velocity * 1.6));
    rocket.style.setProperty('--space-tilt', `${tilt.toFixed(1)}deg`);
    if (changed && !motion.matches) {
      trail.classList.toggle('is-flying', !grounded && !orbit);
      trail.classList.toggle('is-descending', descending);
      trail.classList.toggle('is-launching', !descending && fraction > 0 && fraction < .08);
      rocket.style.setProperty('--space-thrust', `${Math.min(1, .5 + Math.abs(velocity) * .1 + Math.sin(window.scrollY * .1) * .07).toFixed(2)}`);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        trail.classList.remove('is-flying', 'is-descending', 'is-launching');
        rocket.style.setProperty('--space-tilt', '0deg');
        if (state) state.textContent = grounded ? 'ON EARTH' : orbit ? 'IN ORBIT' : 'EXPLORING';
      }, 180);
    }
    if (motion.matches) trail.classList.remove('is-flying', 'is-descending', 'is-launching');
    if (state) state.textContent = grounded ? 'ON EARTH' : orbit ? 'IN ORBIT' : changed ? descending ? 'LANDING' : 'LIFT OFF' : 'EXPLORING';
    pending = false;
  };
  const schedule = () => {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  compact.addEventListener('change', layout);
  motion.addEventListener('change', schedule);
  new ResizeObserver(layout).observe(document.body);
  rocket.addEventListener('click', () => window.scrollTo({ top: 0, behavior: motion.matches ? 'auto' : 'smooth' }));
  layout();
})();
