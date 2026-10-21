const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.mobile-menu');
const desktop = document.querySelector('.desktop-nav');
const mobileBreakpoint = window.matchMedia('(min-width: 768px)');

function setMenu(open, restoreFocus = false) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menu.classList.toggle('is-open', open);
  menu.inert = !open;
  document.body.classList.toggle('menu-open', open);
  document.querySelector('main').inert = open;
  document.querySelector('footer').inert = open;
  if (open) requestAnimationFrame(() => requestAnimationFrame(() => {
    if (toggle.getAttribute('aria-expanded') === 'true') {
      menu.querySelector('a').focus({ preventScroll: true });
    }
  }));
  if (restoreFocus) toggle.focus({ preventScroll: true });
}

toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  setMenu(open, !open);
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (toggle.getAttribute('aria-expanded') !== 'true') return;
  if (event.key === 'Escape') setMenu(false, true);
  if (event.key === 'Tab') {
    const controls = [toggle, ...menu.querySelectorAll('a')];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }
});
mobileBreakpoint.addEventListener('change', event => { if (event.matches) setMenu(false); });

if ('IntersectionObserver' in window) {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!motionQuery.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
    document.documentElement.classList.add('motion-ready');
  }
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const currentLink = [...desktop.querySelectorAll('a')].find(link =>
        link.hash === `#${entry.target.id}` && link.pathname === location.pathname
      );
      if (!currentLink) return;
      desktop.querySelectorAll('a').forEach(link => {
        if (link === currentLink) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-20% 0px -55% 0px' });
  document.querySelectorAll('main > section[id]').forEach(section => sectionObserver.observe(section));

  const policyLinks = [...document.querySelectorAll('.legal-nav a')];
  if (policyLinks.length) {
    const policyObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        policyLinks.forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-120px 0px -55% 0px' });
    document.querySelectorAll('.legal-document section').forEach(section => policyObserver.observe(section));
  }
}
