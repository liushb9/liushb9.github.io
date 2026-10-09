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

  // Surface samples of simple mechanical parts; no WebGL or model downloads.
  const makeRobotStudy = () => {
    const figure = document.querySelector('[data-robot-study]');
    const canvas = figure?.querySelector('canvas');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return () => {};
    const add = (a, b) => a.map((v, i) => v + b[i]);
    const mul = (a, n) => a.map(v => v * n);
    const sub = (a, b) => a.map((v, i) => v - b[i]);
    const unit = a => mul(a, 1 / Math.hypot(...a));
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const ink = ['#684582', '#8e789b', '#b39bc0', '#ae925f'];
    let points = [];
    const dot = (p, normal, color = 0, edge = false) => points.push({p, normal, color, edge});
    const cylinder = (start, end, radius, color = 0, endRadius = radius) => {
      const vector = sub(end, start);
      const axis = unit(vector);
      const u = unit(cross(axis, Math.abs(axis[2]) > .9 ? [0, 1, 0] : [0, 0, 1]));
      const v = cross(axis, u);
      const rows = Math.max(2, Math.ceil(Math.hypot(...vector) / 2.2));
      const columns = Math.max(14, Math.ceil(2 * Math.PI * Math.max(radius, endRadius) / 2.2));
      for (let row = 0; row <= rows; row++) {
        const t = row / rows;
        const r = radius + (endRadius - radius) * t;
        for (let col = 0; col < columns; col++) {
          const angle = (col + (row % 2) * .5) / columns * Math.PI * 2;
          const normal = add(mul(u, Math.cos(angle)), mul(v, Math.sin(angle)));
          dot(add(add(start, mul(vector, t)), mul(normal, r)), normal, color, row === 0 || row === rows);
        }
      }
      // Dotted end caps also describe the hinge axes.
      for (const [center, sign] of [[start, -1], [end, 1]]) {
        const r = sign === 1 ? endRadius : radius;
        for (let ring = 1.6; ring < r; ring += 2) {
          const count = Math.ceil(Math.PI * ring);
          for (let i = 0; i < count; i++) {
            const angle = i / count * Math.PI * 2;
            dot(add(center, add(mul(u, Math.cos(angle) * ring), mul(v, Math.sin(angle) * ring))), mul(axis, sign), color);
          }
        }
      }
    };
    const box = (center, size, color = 1) => {
      for (let axis = 0; axis < 3; axis++) {
        const u = (axis + 1) % 3;
        const v = (axis + 2) % 3;
        const rows = Math.ceil(size[u] / 2.3);
        const columns = Math.ceil(size[v] / 2.3);
        for (const side of [-1, 1]) {
          for (let row = 0; row <= rows; row++) {
            for (let col = 0; col <= columns; col++) {
              const p = [...center];
              const normal = [0, 0, 0];
              normal[axis] = side;
              p[axis] += side * size[axis] / 2;
              p[u] += (row / rows - .5) * size[u];
              p[v] += (col / columns - .5) * size[v];
              dot(p, normal, color, row === 0 || col === 0 || row === rows || col === columns);
            }
          }
        }
      }
    };
    const hinge = (center, r) => cylinder(add(center, [-r * .75, 0, 0]), add(center, [r * .75, 0, 0]), r, 0);
    const finger = (root, lengths, spread, bend) => {
      let start = root;
      lengths.forEach((length, i) => {
        const flex = .05 + bend * (i + 1);
        const end = add(start, [Math.sin(spread) * length, Math.cos(spread) * Math.cos(flex) * length, Math.sin(flex) * length]);
        const axis = unit(sub(end, start));
        const r = i === 0 ? 3.7 : i === 1 ? 3.2 : 2.8;
        hinge(start, r + .45);
        cylinder(add(start, mul(axis, 1.1)), add(end, mul(axis, -.8)), r, i === 1 ? 1 : 0, r * .9);
        start = end;
      });
    };
    const model = fraction => {
      points = [];
      cylinder([15, -65, -4], [3, -33, 0], 13, 1, 11);
      cylinder([3, -33, 0], [0, -24, 0], 12, 0, 10);
      cylinder([0, -24, 0], [-1, -16, 0], 8, 1);
      // Flange rings and exposed tendons at the wrist.
      cylinder([13.5, -61, -3.5], [12.5, -58, -3], 13.5, 0);
      cylinder([5, -38, -.5], [4, -35, 0], 12, 0);
      for (const x of [-5, 0, 5]) cylinder([x + 1, -24, 7], [x, -12, 7], .8, x === 0 ? 3 : 0);
      box([-1, 0, 0], [38, 29, 12]);
      box([-1, -11, 1], [33, 4, 14], 0);
      for (const x of [-14, -5, 4, 13]) {
        box([x, 0, 6.6], [2, 18, 1], 0);
        cylinder([x, -6, 7.5], [x, -6, 8.2], 1.8, 3);
      }
      const bend = .045 + Math.sin(fraction * Math.PI) * .12;
      finger([-15, 15, 0], [16, 12, 8], -.12, bend);
      finger([-5, 15, 0], [19, 13, 9], -.02, bend);
      finger([5, 15, 0], [17, 12, 8], .12, bend * 1.1);
      finger([15, 13, 0], [13, 10, 7], .3, bend * 1.3);
      hinge([-20, -6, 3], 5);
      finger([-20, -6, 3], [13, 11, 8], -.95, bend * .6);
    };
    const rotate = (p, yaw, pitch, roll) => {
      const x = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw);
      const z = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw);
      const y = p[1] * Math.cos(pitch) - z * Math.sin(pitch);
      const depth = p[1] * Math.sin(pitch) + z * Math.cos(pitch);
      return [x * Math.cos(roll) - y * Math.sin(roll), x * Math.sin(roll) + y * Math.cos(roll), depth];
    };
    let lastFraction = -1;
    let requestedFraction = 0;
    let lastWidth = 0;
    let lastMotion = null;
    let visible = true;
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { lastWidth = 0; draw(requestedFraction); }
    }).observe(figure);
    const draw = fraction => {
      requestedFraction = fraction;
      const width = figure.clientWidth;
      if (!visible || !width) return;
      if (width === lastWidth && Math.abs(fraction - lastFraction) < .004 && lastMotion === motion.matches) return;
      lastWidth = width;
      lastFraction = fraction;
      lastMotion = motion.matches;
      const height = figure.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const pose = motion.matches ? 0 : fraction;
      model(pose);
      const yaw = -.38 + pose * .26;
      const pitch = .16;
      const roll = -.14 + Math.sin(pose * Math.PI) * .045;
      const scale = Math.min(width / 105, height / 142);
      const projected = points.map(point => ({...point, p: rotate(point.p, yaw, pitch, roll), normal: rotate(point.normal, yaw, pitch, roll)})).sort((a, b) => a.p[2] - b.p[2]);
      for (const point of projected) {
        if (point.normal[2] < -.08) continue;
        const perspective = 340 / (340 - point.p[2]);
        const x = width * .52 + point.p[0] * scale * perspective;
        const y = height * .49 - point.p[1] * scale * perspective;
        const light = Math.max(.12, Math.min(1, point.normal[2] * .7 - point.normal[0] * .15 + .2));
        ctx.globalAlpha = (point.edge ? .68 : .18 + light * .48) * (point.color === 2 ? .7 : 1);
        ctx.fillStyle = ink[point.color];
        ctx.beginPath();
        ctx.arc(x, y, (point.edge ? .62 : .53) * scale * perspective, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    return draw;
  };

  const drawRobot = makeRobotStudy();
  const progress = document.querySelector('[data-reading-progress]');
  const trail = document.querySelector('[data-space-trail]');
  const rocket = document.querySelector('[data-space-return]');
  const percent = document.querySelector('[data-space-percent]');
  const state = document.querySelector('[data-space-state]');
  const figure = document.querySelector('[data-robot-study]');
  const content = document.querySelector('.page__content, .archive');
  const footer = document.querySelector('.page__footer');
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
    if (figure) {
      figure.classList.toggle('is-margin', !compact.matches && gutter >= 225 && window.innerHeight >= 650);
      figure.style.setProperty('--robot-footer-bottom', `${(footer?.offsetHeight || 140) + 16}px`);
    }
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
    drawRobot(fraction);
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
