// Run in the head so the branded screen is present before page content paints.
(() => {
  const root = document.documentElement;
  let dark = false;
  try { dark = localStorage.getItem('alderive-theme') === 'dark'; } catch (_) {}
  const asset = new URL(dark ? './images/loading-logo-dark.svg' : './images/loading-logo-light.svg', document.currentScript.src).href;
  const style = document.createElement('style');
  style.textContent = `
    html.page-loading { overflow: hidden !important; }
    html.page-loading body { visibility: hidden !important; }
    html.page-loading dialog { visibility: hidden !important; }
    html.page-loading dialog::backdrop { background: transparent !important; backdrop-filter: none !important; }
    html.page-loading::before {
      content: '';
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: ${dark ? '#0A1628' : '#F5F2E8'};
      pointer-events: auto;
    }
    html.page-loading::after {
      content: '';
      position: fixed;
      left: 50%;
      top: 50%;
      top: 50dvh;
      transform: translate(-50%, -50%);
      width: min(272px, 61.2vw);
      aspect-ratio: 472.27 / 139;
      margin: 0;
      padding: 0;
      z-index: 2147483647;
      background: url("${asset}") center / contain no-repeat;
      pointer-events: none;
    }
    @media print { html.page-loading body { visibility: visible !important; } html.page-loading::before, html.page-loading::after { display: none; } }
  `;
  document.head.append(style);
  root.classList.add('page-loading');
  root.setAttribute('aria-busy', 'true');
  let finished = false;
  function reveal() {
    if (finished) return;
    finished = true;
    clearTimeout(safetyTimer);
    root.classList.remove('page-loading');
    root.removeAttribute('aria-busy');
    style.remove();
  }
  // Keep the safety ceiling in case document readiness never fires.
  const safetyTimer = setTimeout(reveal, 3000);
  window.addEventListener('DOMContentLoaded', reveal, { once: true });
  // Back/forward restores must never bring back a stale loading screen.
  window.addEventListener('pageshow', event => { if (event.persisted) reveal(); });
})();
