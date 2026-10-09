/* Physics stays local, and sleeps when the playground is out of view. */
(() => {
  'use strict';
  const M = window.Matter;
  if (!M || !document.querySelector('[data-playground]')) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const step = 1000 / 60;

  function animate(element, runtime) {
    let visible = false;
    let frame = 0;
    let last = 0;
    let accumulator = 0;
    const enabled = () => visible && !document.hidden && (!runtime.enabled || runtime.enabled());
    function tick(time) {
      frame = 0;
      if (!enabled()) { last = 0; accumulator = 0; return; }
      accumulator += last ? Math.min(40, time - last) : step;
      last = time;
      let updates = 0;
      while (accumulator >= step && updates < 3) {
        runtime.update(step);
        accumulator -= step;
        updates += 1;
      }
      runtime.draw();
      if (runtime.awake()) frame = requestAnimationFrame(tick);
      else { last = 0; accumulator = 0; }
    }
    function wake() {
      if (!frame && enabled()) frame = requestAnimationFrame(tick);
    }
    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      accumulator = 0;
    }
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) wake(); else stop();
    }, { rootMargin: '60px' }).observe(element);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : wake());
    window.addEventListener('pagehide', stop);
    window.addEventListener('pageshow', wake);
    return { wake, stop };
  }

  function deskToys(scene) {
    const engine = M.Engine.create({ enableSleeping: true });
    engine.gravity.y = 1.1;
    const root = scene.closest('[data-playground]');
    const status = scene.querySelector('[data-toy-status]');
    let width = scene.clientWidth;
    let height = scene.clientHeight;
    let walls = [];
    let drag = null;
    let suppressClick = false;
    let tidyTimer;
    let loop;
    const items = [...scene.querySelectorAll('[data-toy]')].map((el, index) => {
      const scale = width < 480 ? .72 : 1;
      const w = Number(el.dataset.width) * scale;
      const h = Number(el.dataset.height) * scale;
      const options = { restitution: .48, friction: .4, frictionAir: .015, sleepThreshold: 55, angle: [-.12, .08, .2, -.08][index] };
      const x = width * (index + .5) / 4;
      const y = height - h / 2 - 65 - index * 8;
      const body = el.dataset.toy === 'globe' ? M.Bodies.circle(x, y, w / 2 - 3 * scale, options) : M.Bodies.rectangle(x, y, w - 6 * scale, h - 4 * scale, { ...options, chamfer: { radius: 5 * scale } });
      el.style.setProperty('--toy-width', `${w}px`);
      el.style.setProperty('--toy-height', `${h}px`);
      M.Composite.add(engine.world, body);
      return { el, body, w, h, scale, index };
    });
    function boundaries() {
      walls.forEach(wall => M.Composite.remove(engine.world, wall));
      walls = [
        M.Bodies.rectangle(width / 2, height + 3, width + 120, 40, { isStatic: true, friction: .6 }),
        M.Bodies.rectangle(-20, height / 2 - 90, 40, height + 500, { isStatic: true }),
        M.Bodies.rectangle(width + 20, height / 2 - 90, 40, height + 500, { isStatic: true }),
        M.Bodies.rectangle(width / 2, -160, width + 120, 40, { isStatic: true })
      ];
      M.Composite.add(engine.world, walls);
    }
    function draw() {
      items.forEach(({ el, body, w, h }) => {
        el.style.transform = `translate3d(${(body.position.x - w / 2).toFixed(2)}px, ${(body.position.y - h / 2).toFixed(2)}px, 0) rotate(${body.angle.toFixed(4)}rad)`;
      });
    }
    function release(event) {
      if (!drag || (event && event.pointerId !== drag.id)) return;
      const active = drag;
      drag = null;
      suppressClick = active.distance > 5;
      setTimeout(() => { suppressClick = false; }, 0);
      M.Composite.remove(engine.world, active.constraint);
      active.item.el.classList.remove('is-held');
      if (active.item.el.hasPointerCapture(active.id)) active.item.el.releasePointerCapture(active.id);
      const velocity = active.item.body.velocity;
      M.Body.setVelocity(active.item.body, { x: clamp(velocity.x, -18, 18), y: clamp(velocity.y, -18, 18) });
      if (motion.matches) {
        for (let i = 0; i < 150; i += 1) M.Engine.update(engine, step);
        draw();
      }
      loop?.wake();
    }
    function tidy(animateMove = true) {
      release();
      clearTimeout(tidyTimer);
      scene.classList.toggle('is-tidying', animateMove && !motion.matches);
      const gap = width < 480 ? 12 : 30;
      const total = items.reduce((sum, item) => sum + item.w, 0) + gap * (items.length - 1);
      let x = (width - total) / 2;
      items.forEach(item => {
        M.Body.setAngle(item.body, 0);
        M.Body.setPosition(item.body, { x: x + item.w / 2, y: height - 18 - item.h / 2 + (item.el.dataset.toy === 'globe' ? 3 * item.scale : 2 * item.scale) });
        M.Body.setVelocity(item.body, { x: 0, y: 0 });
        M.Body.setAngularVelocity(item.body, 0);
        M.Sleeping.set(item.body, true);
        x += item.w + gap;
      });
      draw();
      tidyTimer = setTimeout(() => scene.classList.remove('is-tidying'), 400);
      if (animateMove) status.textContent = 'All tidy. Until the next toss.';
    }
    function point(event) {
      const rect = scene.getBoundingClientRect();
      return { x: clamp(event.clientX - rect.left, 5, width - 5), y: clamp(event.clientY - rect.top, -100, height - 25) };
    }
    items.forEach(item => {
      item.el.addEventListener('pointerdown', event => {
        if (event.button !== 0 || drag) return;
        scene.classList.remove('is-tidying');
        item.el.focus({ preventScroll: true });
        const p = point(event);
        M.Sleeping.set(item.body, false);
        const constraint = M.Constraint.create({ pointA: p, bodyB: item.body, pointB: { x: p.x - item.body.position.x, y: p.y - item.body.position.y }, stiffness: .2, damping: .12, length: 0 });
        M.Composite.add(engine.world, constraint);
        drag = { item, constraint, id: event.pointerId, x: event.clientX, y: event.clientY, distance: 0 };
        item.el.setPointerCapture(event.pointerId);
        item.el.classList.add('is-held');
        loop.wake();
      });
      item.el.addEventListener('pointermove', event => {
        if (!drag || event.pointerId !== drag.id) return;
        drag.constraint.pointA = point(event);
        drag.distance = Math.max(drag.distance, Math.hypot(event.clientX - drag.x, event.clientY - drag.y));
        loop.wake();
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => item.el.addEventListener(name, release));
      item.el.addEventListener('click', event => {
        if (event.detail && suppressClick) return;
        scene.classList.remove('is-tidying');
        M.Sleeping.set(item.body, false);
        M.Body.setVelocity(item.body, { x: (Math.random() - .5) * 8, y: -10 });
        M.Body.setAngularVelocity(item.body, (Math.random() - .5) * .22);
        if (motion.matches) {
          for (let i = 0; i < 180; i += 1) M.Engine.update(engine, step);
          draw();
        }
        loop.wake();
      });
    });
    boundaries();
    draw();
    loop = animate(scene, {
      update: () => M.Engine.update(engine, step),
      draw,
      awake: () => !!drag || items.some(item => !item.body.isSleeping)
    });
    root.querySelector('[data-tidy]').addEventListener('click', () => tidy());
    motion.addEventListener('change', () => { if (motion.matches) tidy(false); });
    new ResizeObserver(() => {
      const nextWidth = scene.clientWidth;
      const nextHeight = scene.clientHeight;
      if (!nextWidth || (nextWidth === width && nextHeight === height)) return;
      release();
      scene.classList.remove('is-tidying');
      const ratio = nextWidth / width;
      width = nextWidth;
      height = nextHeight;
      items.forEach(item => {
        const scale = width < 480 ? .72 : 1;
        M.Body.scale(item.body, scale / item.scale, scale / item.scale);
        item.scale = scale;
        item.w = Number(item.el.dataset.width) * scale;
        item.h = Number(item.el.dataset.height) * scale;
        item.el.style.setProperty('--toy-width', `${item.w}px`);
        item.el.style.setProperty('--toy-height', `${item.h}px`);
        M.Body.setPosition(item.body, { x: clamp(item.body.position.x * ratio, item.w / 2 + 5, width - item.w / 2 - 5), y: Math.min(item.body.position.y, height - 18 - item.h / 2) });
        M.Body.setVelocity(item.body, { x: 0, y: 0 });
        M.Sleeping.set(item.body, false);
      });
      boundaries();
      if (motion.matches) tidy(false); else { draw(); loop.wake(); }
    }).observe(scene);
    if (motion.matches) tidy(false);
  }

  function gripperGame(details) {
    const stage = details.querySelector('[data-grab-stage]');
    const score = details.querySelector('[data-grab-score]');
    const status = details.querySelector('[data-grab-status]');
    const head = details.querySelector('[data-claw-head]');
    const cart = details.querySelector('[data-claw-cart]');
    const cable = details.querySelector('[data-claw-cable]');
    const leftFinger = details.querySelector('[data-claw-left]');
    const rightFinger = details.querySelector('[data-claw-right]');
    const grabButton = details.querySelector('[data-grab]');
    const moveButtons = [details.querySelector('[data-grab-left]'), details.querySelector('[data-grab-right]')];
    const engine = M.Engine.create({ enableSleeping: true, constraintIterations: 4 });
    engine.gravity.y = 1.05;
    M.Composite.add(engine.world, [
      M.Bodies.rectangle(280, 273, 600, 40, { isStatic: true, friction: .7 }),
      M.Bodies.rectangle(-10, 140, 20, 500, { isStatic: true }),
      M.Bodies.rectangle(570, 140, 20, 500, { isStatic: true }),
      M.Bodies.rectangle(448, 223, 6, 64, { isStatic: true }),
      M.Bodies.rectangle(528, 223, 6, 64, { isStatic: true })
    ]);
    const svgNS = 'http://www.w3.org/2000/svg';
    const blockLayer = details.querySelector('[data-grab-blocks]');
    const palette = ['#d8c4e6', '#c5d8d0', '#e7d09d', '#d1dce8'];
    const initialX = [105, 190, 280, 375];
    const blocks = initialX.map((x, index) => {
      const size = index % 2 ? 32 : 34;
      const body = M.Bodies.rectangle(x, 218, size, size, { restitution: .2, friction: .6, frictionAir: .012, chamfer: { radius: 4 }, sleepThreshold: 55 });
      const el = document.createElementNS(svgNS, 'g');
      el.setAttribute('data-grab-block', String(index));
      el.innerHTML = `<rect x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" rx="4" fill="${palette[index]}" stroke="#705181" stroke-width="1.7"/><path d="M${-size / 2 + 5} ${-size / 2 + 5}H${size / 2 - 5}" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><text x="0" y="5" text-anchor="middle" fill="#705181" font-family="Georgia, serif" font-size="13">${'ABCD'[index]}</text>`;
      blockLayer.appendChild(el);
      M.Composite.add(engine.world, body);
      return { body, el, size, index, inertia: body.inertia, scored: false };
    });
    const claw = { x: initialX[0], y: 75, open: 1 };
    let phase = null;
    let busy = false;
    let held = null;
    let holdConstraint = null;
    let count = 0;
    let homeX = claw.x;
    let loop;
    const ease = value => value * value * (3 - 2 * value);

    function controls() {
      grabButton.disabled = busy || count === blocks.length;
      moveButtons.forEach(button => { button.disabled = busy || count === blocks.length; });
      stage.setAttribute('aria-busy', String(busy));
    }
    function draw() {
      head.setAttribute('transform', `translate(${claw.x.toFixed(2)} ${claw.y.toFixed(2)})`);
      cart.setAttribute('transform', `translate(${claw.x.toFixed(2)} 31)`);
      cable.setAttribute('x1', claw.x.toFixed(2));
      cable.setAttribute('x2', claw.x.toFixed(2));
      cable.setAttribute('y2', (claw.y - 8).toFixed(2));
      const spread = 17 + claw.open * 7;
      const tip = 14 + claw.open * 7;
      leftFinger.setAttribute('d', `M-12 8L-${spread.toFixed(2)} 23L-${tip.toFixed(2)} 38L-${(tip - 5).toFixed(2)} 38`);
      rightFinger.setAttribute('d', `M12 8L${spread.toFixed(2)} 23L${tip.toFixed(2)} 38L${(tip - 5).toFixed(2)} 38`);
      blocks.forEach(block => block.el.setAttribute('transform', `translate(${block.body.position.x.toFixed(2)} ${block.body.position.y.toFixed(2)}) rotate(${(block.body.angle * 180 / Math.PI).toFixed(2)})`));
    }
    function travel(name, x, y, duration, done, openness = claw.open) {
      phase = { name, fromX: claw.x, fromY: claw.y, fromOpen: claw.open, x, y, openness, duration: motion.matches ? 0 : duration, elapsed: 0, done };
      loop?.wake();
    }
    function moveTo(x) {
      if (busy || count === blocks.length) return;
      travel('aim', clamp(x, 40, 415), 75, 170, null, 1);
    }
    function moveBy(amount) {
      moveTo((phase?.name === 'aim' ? phase.x : claw.x) + amount);
    }
    function drop() {
      if (!held) return;
      M.Composite.remove(engine.world, holdConstraint);
      holdConstraint = null;
      M.Body.setInertia(held.body, held.inertia);
      M.Body.setAngle(held.body, 0);
      M.Body.setVelocity(held.body, { x: 0, y: 0 });
      M.Body.setAngularVelocity(held.body, 0);
      M.Sleeping.set(held.body, false);
      held = null;
    }
    function finish() {
      busy = false;
      claw.open = 1;
      controls();
    }
    function collect() {
      blocks.forEach(block => {
        if (block.scored || block === held) return;
        const p = block.body.position;
        if (p.x > 451 + block.size / 2 - 1 && p.x < 525 - block.size / 2 + 1 && p.y > 190) {
          block.scored = true;
          count += 1;
          score.textContent = String(count);
          const complete = count === blocks.length;
          details.classList.toggle('is-complete', complete);
          status.textContent = complete ? 'All four collected. Nice hands!' : `Nice grab. ${count} of 4 collected.`;
          controls();
        }
      });
    }
    function grab() {
      if (busy || count === blocks.length) return;
      if (phase?.name === 'aim') { claw.x = phase.x; phase = null; }
      busy = true;
      controls();
      homeX = claw.x;
      const target = blocks.filter(block => !block.scored && block.body.position.x < 430 && Math.abs(block.body.position.x - claw.x) <= 22).sort((a, b) => a.body.position.y - b.body.position.y)[0];
      const downY = target ? clamp(target.body.position.y - 35, 100, 213) : 207;
      status.textContent = 'Steady…';
      travel('lower', claw.x, downY, 600, () => {
        travel('close', claw.x, claw.y, 160, () => {
          if (target && Math.abs(target.body.position.x - claw.x) <= 24 && Math.abs(target.body.position.y - (claw.y + 35)) < 21) {
            held = target;
            M.Sleeping.set(target.body, false);
            M.Body.setAngle(target.body, 0);
            M.Body.setPosition(target.body, { x: claw.x, y: claw.y + 35 });
            M.Body.setVelocity(target.body, { x: 0, y: 0 });
            M.Body.setAngularVelocity(target.body, 0);
            // The rigid fingers hold orientation until the block is released.
            M.Body.setInertia(target.body, Infinity);
            holdConstraint = M.Constraint.create({ pointA: { x: claw.x, y: claw.y + 18 }, bodyB: target.body, pointB: { x: 0, y: -17 }, stiffness: .85, damping: .2, length: 0 });
            M.Composite.add(engine.world, holdConstraint);
            status.textContent = 'Got one. Bringing it home.';
            travel('lift', claw.x, 75, 550, () => {
              travel('carry', target.index % 2 ? 507 : 470, 75, 1000, () => {
                travel('release', claw.x, 75, 180, () => {
                  drop();
                  travel('return', homeX, 75, 650, finish, 1);
                }, 1);
              });
            });
          } else {
            status.textContent = 'Missed. Aim over a block and try again.';
            travel('empty', claw.x, 75, 500, () => { finish(); }, 1);
          }
        }, 0);
      }, 1);
    }
    function movement(delta) {
      let transitions = 0;
      while (phase && transitions < 8) {
        const current = phase;
        current.elapsed += delta;
        const fraction = current.duration ? Math.min(1, current.elapsed / current.duration) : 1;
        const amount = ease(fraction);
        claw.x = current.fromX + (current.x - current.fromX) * amount;
        claw.y = current.fromY + (current.y - current.fromY) * amount;
        claw.open = current.fromOpen + (current.openness - current.fromOpen) * amount;
        if (holdConstraint) holdConstraint.pointA = { x: claw.x, y: claw.y + 18 };
        if (motion.matches && held) {
          M.Body.setPosition(held.body, { x: claw.x, y: claw.y + 35 });
          M.Body.setVelocity(held.body, { x: 0, y: 0 });
        }
        if (fraction < 1) break;
        phase = null;
        current.done?.();
        transitions += 1;
        if (!motion.matches) break;
      }
    }
    function update() {
      movement(step);
      M.Engine.update(engine, step);
      collect();
      // Instant transport is easier to follow with reduced motion enabled.
      if (motion.matches && !phase && !held) {
        for (let i = 0; i < 150; i += 1) M.Engine.update(engine, step);
        collect();
      }
    }
    function reset() {
      phase = null;
      drop();
      busy = false;
      count = 0;
      claw.x = initialX[0];
      claw.y = 75;
      claw.open = 1;
      blocks.forEach(block => {
        block.scored = false;
        M.Body.setAngle(block.body, 0);
        M.Body.setPosition(block.body, { x: initialX[block.index], y: 218 });
        M.Body.setVelocity(block.body, { x: 0, y: 0 });
        M.Body.setAngularVelocity(block.body, 0);
        M.Sleeping.set(block.body, false);
      });
      details.classList.remove('is-complete');
      score.textContent = '0';
      status.textContent = "Four blocks. Let's see your aim.";
      controls();
      if (motion.matches) for (let i = 0; i < 150; i += 1) M.Engine.update(engine, step);
      draw();
      loop?.wake();
    }
    loop = animate(stage, { update, draw, enabled: () => details.open, awake: () => !!phase || blocks.some(block => !block.body.isSleeping) });
    moveButtons[0].addEventListener('click', () => moveBy(-22));
    moveButtons[1].addEventListener('click', () => moveBy(22));
    grabButton.addEventListener('click', grab);
    details.querySelector('[data-grab-reset]').addEventListener('click', reset);
    stage.addEventListener('pointerdown', event => {
      if (event.button !== 0 || busy) return;
      const rect = stage.getBoundingClientRect();
      moveTo((event.clientX - rect.left) * 560 / rect.width);
      stage.focus({ preventScroll: true });
    });
    details.addEventListener('keydown', event => {
      if (event.target.closest('summary') || event.target.matches('[data-grab-reset]')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); moveBy(event.key === 'ArrowLeft' ? -22 : 22); }
      // Native buttons already handle Space. Only the stage needs a handler.
      if (event.key === ' ' && event.target === stage) { event.preventDefault(); if (!event.repeat) grab(); }
    });
    details.addEventListener('toggle', () => { if (details.open) loop.wake(); else loop.stop(); });
    motion.addEventListener('change', () => loop.wake());
    reset();
  }

  document.querySelectorAll('[data-toy-desk]').forEach(deskToys);
  document.querySelectorAll('[data-grab-game]').forEach(gripperGame);
})();
