const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.mobile-menu');
const desktop = document.querySelector('.desktop-nav');
const mobileBreakpoint = window.matchMedia('(min-width: 768px)');
const root = document.documentElement;
root.dataset.input = 'pointer';

function setInput(type) {
  if (root.dataset.input !== type) root.dataset.input = type;
}
document.addEventListener('pointerdown', () => setInput('pointer'), true);
document.addEventListener('pointermove', event => {
  if (event.pointerType === 'mouse' && (event.movementX || event.movementY)) setInput('pointer');
}, { passive: true });
document.addEventListener('keydown', () => setInput('keyboard'), true);

function setMenu(open, restoreFocus = false) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menu.classList.toggle('is-open', open);
  menu.inert = !open;
  document.body.classList.toggle('menu-open', open);
  document.querySelector('main').inert = open;
  document.querySelector('footer').inert = open;
  if (open && root.dataset.input === 'keyboard') {
    menu.querySelector('a').focus({ preventScroll: true });
  }
  if (restoreFocus) toggle.focus({ preventScroll: true });
}

toggle.addEventListener('click', event => {
  if (event.detail === 0) root.dataset.input = 'keyboard';
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  setMenu(open, !open);
});
menu.addEventListener('transitionend', event => {
  if (event.target === menu && event.propertyName === 'opacity' &&
      toggle.getAttribute('aria-expanded') === 'true' && document.activeElement === toggle) {
    menu.querySelector('a').focus({ preventScroll: true });
  }
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
mobileBreakpoint.addEventListener('change', event => {
  if (event.matches) {
    const wasOpen = toggle.getAttribute('aria-expanded') === 'true';
    setMenu(false);
    if (wasOpen) desktop.querySelector('a').focus({ preventScroll: true });
  }
});

// Native details keep their immediate layout and keyboard behavior; only pointer-opened answers fade.
document.querySelectorAll('.contact-next-step, .faq-list details').forEach(details => {
  let fadeOnOpen = false;
  let answerAnimations = [];
  details.addEventListener('keydown', () => {
    fadeOnOpen = false;
    answerAnimations.forEach(animation => animation.cancel());
  });
  details.querySelector('summary').addEventListener('click', event => {
    fadeOnOpen = event.detail > 0 && !details.open;
  });
  details.addEventListener('toggle', () => {
    answerAnimations.forEach(animation => animation.cancel());
    answerAnimations = [];
    if (details.open && fadeOnOpen) {
      const styles = getComputedStyle(root);
      details.querySelectorAll(':scope > p').forEach(answer => {
        answerAnimations.push(answer.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: parseFloat(styles.getPropertyValue('--motion-fade')),
          easing: styles.getPropertyValue('--curve').trim()
        }));
      });
    }
    fadeOnOpen = false;
  });
});

// Determine the current section from the viewport, including sections with no navigation link.
// Read all geometry before writing attributes, and schedule work only when the page changes.
const navigationGroups = [
  { links: [...desktop.querySelectorAll('a')], sections: [...document.querySelectorAll('main > section[id]')] },
  { links: [...document.querySelectorAll('.legal-nav a')], sections: [...document.querySelectorAll('.legal-document section')] }
].map(group => ({
  ...group,
  links: group.links.filter(link => link.hash && link.pathname === location.pathname),
  current: undefined
})).filter(group => group.links.length && group.sections.length);

let navigationFrame = 0;
function updateNavigation() {
  navigationFrame = 0;
  const readingLine = Math.min(innerHeight * .3, 220);
  const atEnd = scrollY + innerHeight >= root.scrollHeight - 2;
  const selections = navigationGroups.map(group => {
    const sections = group.sections.map(section => ({ section, top: section.getBoundingClientRect().top }));
    const currentSection = atEnd ? sections.at(-1)?.section : sections.filter(item => item.top <= readingLine).at(-1)?.section;
    return group.links.find(link => link.hash === `#${currentSection?.id}`) || null;
  });
  navigationGroups.forEach((group, index) => {
    const current = selections[index];
    if (group.current === current) return;
    group.current = current;
    group.links.forEach(link => {
      if (link === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}
function queueNavigation() {
  if (navigationGroups.length && !navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
}
window.addEventListener('scroll', queueNavigation, { passive: true });
window.addEventListener('resize', queueNavigation, { passive: true });
window.addEventListener('pageshow', queueNavigation);
document.addEventListener('toggle', queueNavigation, true);
document.fonts.ready.then(queueNavigation);
queueNavigation();
