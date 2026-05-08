/* =========================================================
   Snail — main.js
   Marquee duplicator + active nav state + reveal-on-scroll
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* Active nav link from current pathname */
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav__link').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('is-active');
    }
  });

  /* Marquee — duplicate content for seamless loop */
  document.querySelectorAll('.marquee__track').forEach(track => {
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.parentNode.append(clone);
  });

  /* Reveal-on-scroll for elements marked [data-reveal] */
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

  /* Menu page: scrollspy to highlight active tab */
  const tabs = document.querySelectorAll('[data-menu-tab]');
  if (tabs.length) {
    const sections = [...tabs].map(t => document.getElementById(t.dataset.menuTab)).filter(Boolean);
    const spy = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          tabs.forEach(t => t.classList.toggle('is-active', t.dataset.menuTab === entry.target.id));
        }
      }
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(s => spy.observe(s));

    tabs.forEach(t => t.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(t.dataset.menuTab);
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }));
  }

});
