(() => {
  const article = document.querySelector('#paper-content');
  if (!article) return;
  const headings = [...article.querySelectorAll('h2[id], h3[id]')];
  const links = [...document.querySelectorAll('.toc-link')];
  const progress = document.querySelector('#reading-progress');
  const percent = document.querySelector('.reading-percent');
  const panel = document.querySelector('.toc-panel');
  const smallScreen = matchMedia('(max-width: 900px)');
  const resizeToc = () => { panel.open = !smallScreen.matches; };
  smallScreen.addEventListener('change', resizeToc);
  resizeToc();
  links.forEach(link => link.addEventListener('click', () => {
    if (smallScreen.matches) panel.open = false;
  }));
  let pending = false;
  function updateReading() {
    pending = false;
    const headerHeight = document.querySelector('.site-header').offsetHeight;
    const threshold = headerHeight + 45 + (smallScreen.matches ? 54 : 0);
    let active = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= threshold) active = heading;
      else break;
    }
    for (const link of links) {
      if (link.hash === '#' + active.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    const bounds = article.getBoundingClientRect();
    const distance = Math.max(1, bounds.height - innerHeight + headerHeight);
    const value = Math.max(0, Math.min(100, Math.round((headerHeight - bounds.top) / distance * 100)));
    progress.value = value;
    percent.textContent = value + '%';
  }
  function schedule() { if (!pending) {pending = true; requestAnimationFrame(updateReading);} }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule);
  document.addEventListener('orva:languagechange', schedule);
  updateReading();
})();
