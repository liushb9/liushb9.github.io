(() => {
  'use strict';

  const lab = document.querySelector('[data-robot-lab]');
  if (!lab) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const targets = [...lab.querySelectorAll('[data-robot-target]')];
  const resetButton = lab.querySelector('[data-robot-reset]');
  const status = lab.querySelector('[data-robot-status]');
  const counter = lab.querySelector('[data-robot-count]');
  const cube = lab.querySelector('[data-robot-cube]');
  const gripper = lab.querySelector('[data-arm-gripper]');
  const elbow = lab.querySelector('[data-arm-elbow]');
  const upperPaths = [...lab.querySelectorAll('[data-arm-upper], [data-arm-upper-shadow], [data-arm-upper-highlight]')];
  const lowerPaths = [...lab.querySelectorAll('[data-arm-lower], [data-arm-lower-shadow], [data-arm-lower-highlight]')];
  const stages = [...lab.querySelectorAll('[data-lab-stage]')];
  const base = { x: 126, y: 231 };
  const home = { x: 248, y: 139 };
  const initialCube = { x: 257, y: 202 };
  const armLength = 128;
  let hand = { ...home };
  let cubePosition = { ...initialCube };
  let carrying = false;
  let busy = false;
  let placed = 0;
  let run = 0;
  let animationFrame;
  let cancelMovement;
  let initiatingTarget;

  function draw() {
    const dx = hand.x - base.x;
    const dy = hand.y - base.y;
    const distance = Math.max(1, Math.min(armLength * 2 - .1, Math.hypot(dx, dy)));
    const shoulderAngle = Math.atan2(dy, dx) - Math.acos(distance / (armLength * 2));
    const joint = { x: base.x + Math.cos(shoulderAngle) * armLength, y: base.y + Math.sin(shoulderAngle) * armLength };
    upperPaths.forEach(path => path.setAttribute('d', `M${base.x} ${base.y} ${joint.x.toFixed(2)} ${joint.y.toFixed(2)}`));
    lowerPaths.forEach(path => path.setAttribute('d', `M${joint.x.toFixed(2)} ${joint.y.toFixed(2)} ${hand.x.toFixed(2)} ${hand.y.toFixed(2)}`));
    elbow.setAttribute('transform', `translate(${joint.x.toFixed(2)} ${joint.y.toFixed(2)})`);
    gripper.setAttribute('transform', `translate(${hand.x.toFixed(2)} ${hand.y.toFixed(2)})`);
    if (carrying) cubePosition = { x: hand.x, y: hand.y + 25 };
    cube.setAttribute('transform', `translate(${cubePosition.x.toFixed(2)} ${cubePosition.y.toFixed(2)})`);
  }

  function setStage(name, text) {
    stages.forEach(stage => stage.classList.toggle('is-active', stage.dataset.labStage === name));
    status.textContent = text;
    lab.dataset.stage = name;
  }

  function setBusy(value) {
    busy = value;
    targets.forEach(target => { target.disabled = value; });
    lab.setAttribute('aria-busy', String(value));
  }

  function moveTo(position, duration, currentRun) {
    if (motion.matches) {
      hand = { ...position };
      draw();
      return Promise.resolve(currentRun === run);
    }
    return new Promise(resolve => {
      const start = { ...hand };
      const startTime = performance.now();
      cancelMovement = () => resolve(false);
      const tick = now => {
        if (currentRun !== run) { resolve(false); return; }
        const fraction = Math.min(1, (now - startTime) / duration);
        const eased = fraction < .5 ? 4 * fraction ** 3 : 1 - (-2 * fraction + 2) ** 3 / 2;
        hand = { x: start.x + (position.x - start.x) * eased, y: start.y + (position.y - start.y) * eased };
        draw();
        if (fraction < 1) animationFrame = requestAnimationFrame(tick);
        else { cancelMovement = null; resolve(true); }
      };
      animationFrame = requestAnimationFrame(tick);
    });
  }

  async function place(target) {
    if (busy) return;
    const currentRun = ++run;
    const destination = { x: Number(target.dataset.targetX), y: Number(target.dataset.targetY) };
    const source = { ...cubePosition };
    initiatingTarget = target;
    // Keep keyboard focus in the lab while the target buttons are disabled.
    if (document.activeElement === target) lab.focus({ preventScroll: true });
    setBusy(true);
    targets.forEach(item => item.classList.remove('is-placed'));
    setStage('observe', 'Finding the cube');

    if (!await moveTo({ x: source.x, y: source.y - 65 }, 380, currentRun)) return;
    setStage('act', 'Picking it up');
    if (!await moveTo({ x: source.x, y: source.y - 25 }, 280, currentRun)) return;
    carrying = true;
    if (!await moveTo({ x: source.x, y: source.y - 65 }, 300, currentRun)) return;
    status.textContent = `Moving to target ${target.dataset.robotTarget}`;
    if (!await moveTo({ x: destination.x, y: destination.y - 60 }, 500, currentRun)) return;
    if (!await moveTo({ x: destination.x, y: destination.y - 25 }, 300, currentRun)) return;
    carrying = false;
    cubePosition = destination;
    draw();
    target.classList.add('is-placed');
    setStage('learn', `Placed at ${target.dataset.robotTarget}`);
    placed += 1;
    counter.textContent = String(placed);
    if (!await moveTo({ x: destination.x, y: destination.y - 65 }, 250, currentRun)) return;
    if (!await moveTo(home, 400, currentRun)) return;
    setBusy(false);
    status.textContent = `Placed at ${target.dataset.robotTarget}. Try another.`;
    if (document.activeElement === lab) target.focus({ preventScroll: true });
    initiatingTarget = null;
  }

  function reset() {
    run += 1;
    cancelAnimationFrame(animationFrame);
    if (cancelMovement) { cancelMovement(); cancelMovement = null; }
    hand = { ...home };
    cubePosition = { ...initialCube };
    carrying = false;
    placed = 0;
    counter.textContent = '0';
    targets.forEach(target => target.classList.remove('is-placed'));
    setBusy(false);
    setStage('observe', 'Choose a target');
    draw();
    if (document.activeElement === lab && initiatingTarget) initiatingTarget.focus({ preventScroll: true });
    initiatingTarget = null;
  }

  targets.forEach(target => target.addEventListener('click', () => place(target)));
  resetButton.addEventListener('click', reset);
  lab.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === 'r' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      reset();
    }
  });
  draw();
})();
