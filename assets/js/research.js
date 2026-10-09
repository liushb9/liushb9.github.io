(() => {
  'use strict';

  const root = document.documentElement;
  const themeButton = document.querySelector('[data-theme-toggle]');
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  let explicitTheme = false;
  try { explicitTheme = ['dark', 'light'].includes(localStorage.getItem('shengbang-theme')); } catch (_) {}

  function applyTheme(dark, save) {
    root.classList.toggle('dark', dark);
    root.classList.toggle('light', !dark);
    root.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#12151d' : '#f6f7fb');
    if (themeButton) {
      themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      themeButton.setAttribute('aria-pressed', String(dark));
    }
    if (save) {
      explicitTheme = true;
      try { localStorage.setItem('shengbang-theme', dark ? 'dark' : 'light'); } catch (_) {}
    }
  }
  applyTheme(root.classList.contains('dark'), false);
  themeButton?.addEventListener('click', () => applyTheme(!root.classList.contains('dark'), true));
  preference.addEventListener('change', event => { if (!explicitTheme) applyTheme(event.matches, false); });

  const clock = document.querySelector('[data-beijing-time]');
  if (clock) {
    const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit' });
    const updateClock = () => { clock.textContent = `${formatter.format(new Date())} · UTC+8`; };
    updateClock();
    window.setInterval(updateClock, 60000);
  }

  const progress = document.querySelector('[data-reading-progress]');
  if (progress) {
    let scheduled = false;
    const updateProgress = () => {
      const total = Math.max(0, root.scrollHeight - window.innerHeight);
      progress.style.transform = `scaleX(${total ? Math.max(0, Math.min(1, window.scrollY / total)) : 0})`;
      scheduled = false;
    };
    const schedule = () => {
      if (!scheduled) { scheduled = true; window.requestAnimationFrame(updateProgress); }
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    updateProgress();
  }

  document.querySelectorAll('[data-copy-email]').forEach(button => {
    const status = document.querySelector('[data-copy-status]');
    const originalIcon = button.innerHTML;
    let restoreTimer;
    button.addEventListener('click', async () => {
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(button.dataset.copyEmail); copied = true; } catch (_) {}
      }
      if (!copied) {
        const field = document.createElement('textarea');
        field.value = button.dataset.copyEmail;
        field.setAttribute('readonly', '');
        field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(field);
        field.select();
        try { copied = document.execCommand('copy'); } catch (_) {}
        field.remove();
        button.focus({ preventScroll: true });
      }
      if (status) status.textContent = copied ? 'Email address copied.' : 'Copy unavailable. You can select the email address above.';
      if (copied) {
        button.innerHTML = '<svg viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>';
        button.setAttribute('aria-label', 'Email address copied');
        window.clearTimeout(restoreTimer);
        restoreTimer = window.setTimeout(() => {
          button.innerHTML = originalIcon;
          button.setAttribute('aria-label', 'Copy email address');
          if (status) status.textContent = '';
        }, 3000);
      }
    });
  });

  const hobbyButtons = [...document.querySelectorAll('[data-hobby]')];
  const hobbyNote = document.querySelector('[data-hobby-note]');
  hobbyButtons.forEach(button => button.addEventListener('click', () => {
    const wasActive = button.getAttribute('aria-pressed') === 'true';
    hobbyButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button && !wasActive)));
    if (hobbyNote) hobbyNote.textContent = wasActive ? 'What do you like doing outside of work?' : button.dataset.hobby;
  }));

  const visitorMap = document.querySelector('[data-visitor-map]');
  visitorMap?.addEventListener('toggle', () => {
    if (!visitorMap.open || visitorMap.dataset.loaded) return;
    visitorMap.dataset.loaded = 'true';
    const script = document.createElement('script');
    script.id = 'mapmyvisitors';
    script.src = 'https://mapmyvisitors.com/map.js?d=JHwSe0hpWslgMZ3XDNF2Scw8_vYLRfXvMykkTfRYY48&cl=ffffff&w=a';
    script.async = true;
    visitorMap.querySelector('[data-visitor-map-container]').appendChild(script);
  });
})();
