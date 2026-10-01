/* =====================================================
   TABLE OF CONTENTS
   1.  Helpers
   2.  Loading screen
   3.  Typing animation
   4.  Particles (canvas)
   5.  Navigation (sticky, menu, active indicator)
   6.  Scroll reveal
   7.  Animated counters
   8.  Parallax & tilt
   9.  Button ripple, back-to-top, scroll progress
   10. Contact form (opens email app, no backend)
   11. Footer year
   ===================================================== */

'use strict';

/* ---------- 1. HELPERS ---------- */
const $  = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia('(hover: none)').matches;

/* ---------- 2. LOADING SCREEN ---------- */
document.body.classList.add('is-loading');

(function loadingScreen() {
  const loader = $('#loader');
  const arc = $('#ldArc');
  const bar = $('#ldBar');
  const pct = $('#ldPct');
  const status = $('#ldStatus');
  if (!loader) { startReveal(); return; }

  const CIRCUMFERENCE = 2 * Math.PI * 54;            // length of the ring (radius 54)
  const MIN_TIME = prefersReducedMotion ? 0 : 1500;  // show the loader for at least 1.5 seconds
  const messages = [[0, 'Starting up'], [30, 'Loading content'], [60, 'Setting up animations'], [90, 'Almost ready']];

  const startTime = performance.now();
  let shown = 0;
  let pageLoaded = document.readyState === 'complete';
  let finished = false;

  window.addEventListener('load', () => { pageLoaded = true; });

  // Update the ring, the bar, the number and the status text
  function render(p) {
    pct.textContent = Math.round(p) + '%';
    bar.style.width = p + '%';
    arc.style.strokeDashoffset = CIRCUMFERENCE * (1 - p / 100);
    for (const [from, text] of messages) {
      if (p >= from) status.textContent = text;
    }
  }

  // Curtains open and the page animations start
  function finish() {
    if (finished) return;
    finished = true;
    status.textContent = 'Welcome';
    setTimeout(() => {
      loader.classList.add('is-done');
      document.body.classList.remove('is-loading');
      startReveal();
    }, 450);
  }

  function frame(now) {
    const elapsed = now - startTime;
    const ready = pageLoaded && elapsed >= MIN_TIME;
    // Creep up to 90% while waiting, jump to 100% when the page is ready
    const target = ready ? 100 : Math.min(90, MIN_TIME ? (elapsed / MIN_TIME) * 90 : 90);

    shown += Math.max((target - shown) * 0.1, target > shown ? 0.15 : 0);
    if (shown > target) shown = target;
    render(shown);

    if (ready && shown >= 99.5) { render(100); finish(); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------- 3. TYPING ANIMATION ---------- */
// These lines come from the resume: your course and your two internship roles.
const typingLines = [
  'BSc Computer Science Student',
  'Python Developer Intern',
  'Full Stack Development Intern'
];

(function typingEffect() {
  const target = $('#typing');
  if (!target) return;

  if (prefersReducedMotion) {            // no animation: just show the first line
    target.textContent = typingLines[0];
    return;
  }

  let lineIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const line = typingLines[lineIndex];
    charIndex += deleting ? -1 : 1;
    target.textContent = line.slice(0, charIndex);

    let delay = deleting ? 40 : 85;

    if (!deleting && charIndex === line.length) {        // finished typing: pause
      deleting = true;
      delay = 1600;
    } else if (deleting && charIndex === 0) {            // finished deleting: next line
      deleting = false;
      lineIndex = (lineIndex + 1) % typingLines.length;
      delay = 400;
    }
    setTimeout(tick, delay);
  }
  tick();
})();

/* ---------- 4. PARTICLES (canvas) ---------- */
(function particles() {
  const canvas = $('#particles');
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext('2d');
  const colours = ['#8b5cf6', '#3b82f6', '#22d3ee', '#ec4899', '#fb923c'];
  let width, height, dots = [], running = true;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Fewer particles on small screens keeps phones fast
    const count = width < 600 ? 35 : 70;
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      c: colours[Math.floor(Math.random() * colours.length)],
      tw: Math.random() * Math.PI * 2           // twinkle offset
    }));
  }

  function draw(time) {
    if (running) {
      ctx.clearRect(0, 0, width, height);
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = width;  if (d.x > width)  d.x = 0;
        if (d.y < 0) d.y = height; if (d.y > height) d.y = 0;

        ctx.globalAlpha = 0.45 + 0.45 * Math.sin(time / 800 + d.tw);   // twinkling
        ctx.fillStyle = d.c;
        ctx.shadowColor = d.c;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  }

  // Pause drawing when the tab is hidden (saves battery)
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  resize();
  requestAnimationFrame(draw);
})();

/* ---------- 5. NAVIGATION ---------- */
(function navigation() {
  const nav = $('#nav');
  const menu = $('#navMenu');
  const toggle = $('#navToggle');
  const list = $('#navList');
  const indicator = $('#navIndicator');
  const links = $$('.nav__link');
  const sections = links.map(link => $(link.getAttribute('href')));

  // Add a glass background once the page scrolls
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 30);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu open/close
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  links.forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // Move the glowing pill under the active link
  function moveIndicator(link) {
    if (!link || !indicator) return;
    indicator.style.left = link.offsetLeft + 'px';
    indicator.style.width = link.offsetWidth + 'px';
  }

  let currentLink = links[0];
  function setActive(link) {
    links.forEach(l => {
      l.classList.toggle('is-active', l === link);
      if (l === link) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
    currentLink = link;
    moveIndicator(link);
  }

  // Work out which section is in the middle of the screen
  function updateActive() {
    const probe = window.scrollY + window.innerHeight * 0.35;
    let active = links[0];
    sections.forEach((section, i) => {
      if (section && section.offsetTop <= probe) active = links[i];
    });
    // At the very bottom of the page, highlight the last link
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) active = links[links.length - 1];
    if (active !== currentLink) setActive(active);
  }

  window.addEventListener('scroll', updateActive, { passive: true });
  window.addEventListener('resize', () => moveIndicator(currentLink));
  window.addEventListener('load', () => { setActive(links[0]); updateActive(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveIndicator(currentLink));
})();

/* ---------- 6. SCROLL REVEAL ---------- */
function startReveal() {
  const items = $$('.reveal');

  // Stagger siblings slightly so grids animate one after another
  items.forEach(el => {
    const siblings = $$('.reveal', el.parentElement);
    el.style.setProperty('--delay', Math.min(siblings.indexOf(el), 5) * 0.1 + 's');
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
      // Remove the stagger delay once revealed so hover effects respond instantly
      setTimeout(() => entry.target.style.setProperty('--delay', '0s'), 1200);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => observer.observe(el));

  // Timelines draw their line when they scroll into view
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        timelineObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  $$('.timeline').forEach(t => timelineObserver.observe(t));

  // Counters run when the stats scroll into view
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        runCounters();
        counterObserver.disconnect();
      }
    });
  }, { threshold: 0.4 });
  const stats = $('.stats');
  if (stats) counterObserver.observe(stats);
}

/* ---------- 7. ANIMATED COUNTERS ---------- */
function runCounters() {
  $$('.stat__num').forEach(el => {
    const goal = Number(el.dataset.count);
    if (prefersReducedMotion) { el.textContent = goal; return; }

    const duration = 1600;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);       // starts fast, slows down at the end
      el.textContent = Math.round(goal * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/* ---------- 8. PARALLAX & TILT (desktop only) ---------- */
(function parallaxAndTilt() {
  if (prefersReducedMotion || isTouchDevice) return;

  // Background blobs drift slightly with the mouse
  const blobs = $$('.blob');
  let ticking = false;
  window.addEventListener('mousemove', (e) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      blobs.forEach(blob => {
        const depth = Number(blob.dataset.depth || 20);
        blob.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
      });
      ticking = false;
    });
  });

  // Project cards tilt toward the mouse
  $$('.tilt').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

/* ---------- 9. RIPPLE, BACK-TO-TOP, SCROLL PROGRESS ---------- */
// Ripple effect on every button
$$('.btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.width = dot.style.height = size + 'px';
    dot.style.left = (e.clientX - rect.left - size / 2) + 'px';
    dot.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(dot);
    setTimeout(() => dot.remove(), 650);
  });
});

(function scrollWidgets() {
  const toTop = $('#toTop');
  const progress = $('#progress');

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    toTop.classList.toggle('is-shown', scrolled > 500);
    progress.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
  }, { passive: true });

  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ---------- 10. CONTACT FORM ---------- */
/* There is NO backend, so this form cannot send messages by itself.
   When the form is valid, it opens the visitor's email app with the
   message already written, addressed to the email on your resume. */
(function contactForm() {
  const form = $('#contactForm');
  const note = $('#formNote');
  if (!form) return;

  const MY_EMAIL = 'sabareesw186@gmail.com';

  function showNote(text, type) {
    note.textContent = text;
    note.className = 'form__note ' + (type || '');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    ['name', 'email', 'message'].forEach(id => {
      const input = form.elements[id];
      const wrapper = input.closest('.field');
      const ok = input.value.trim() !== '' && (id !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
      wrapper.classList.toggle('is-error', !ok);
      if (!ok) valid = false;
    });

    if (!valid) {
      showNote('Please fill in every field with a valid email address.', 'is-bad');
      return;
    }

    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const message = form.elements.message.value.trim();
    const subject = encodeURIComponent('Portfolio message from ' + name);
    const body = encodeURIComponent(message + '\n\nFrom: ' + name + ' (' + email + ')');

    showNote('Opening your email app. Press Send there to deliver the message.', 'is-ok');
    window.location.href = `mailto:${MY_EMAIL}?subject=${subject}&body=${body}`;
  });

  // Remove the red error state as soon as the visitor types again
  $$('input, textarea', form).forEach(field => {
    field.addEventListener('input', () => field.closest('.field').classList.remove('is-error'));
  });
})();

/* ---------- 11. FOOTER YEAR ---------- */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
/* ---------- 12. PROJECT DETAILS POP-UP ---------- */
/* Click a project card to see an animated explanation.
   All text below comes from the resume. To change a description,
   edit the text inside this DATA object. */
(function projectDetails() {
  const DATA = {
    'School Portal': {
      color: 'purple',
      date: 'Mar 2025 - Apr 2025',
      summary: 'A responsive school portal with separate student, teacher and admin modules. Users get access based on their role, and SQL is used to manage the data behind it.',
      flowTitle: 'The three modules',
      ordered: false,
      flow: ['Student module', 'Teacher module', 'Admin module'],
      features: [
        'Responsive layout for different screen sizes',
        'User authentication and role-based access using JavaScript',
        'Student registration',
        'Course details and notices, managed with SQL'
      ],
      tech: ['HTML', 'CSS', 'JavaScript', 'SQL']
    },
    'Admission Portal': {
      color: 'cyan',
      date: 'Apr 2025 - May 2025',
      summary: 'A complete admission portal with a user-friendly interface. A multi-step form collects the details, everything is stored in a SQL database, and a success message appears after submission.',
      flowTitle: 'How the multi-step form works',
      ordered: true,
      flow: ['Student details', 'Parent details', 'Course details', 'Data stored in the SQL database', 'Success message shown'],
      features: [
        'User-friendly admission interface',
        'Multi-step form for student, parent and course details',
        'All admission data stored in a SQL database',
        'Success message displayed after submission'
      ],
      tech: ['HTML', 'CSS', 'JavaScript', 'SQL']
    },
    'Personal Portfolio': {
      color: 'pink',
      date: 'Jan 2025',
      summary: 'A personal "About Me" portfolio made with HTML, CSS and JavaScript. It has a clean, responsive layout for a better user experience and was hosted locally using VS Code.',
      flowTitle: 'What it is made with',
      ordered: false,
      flow: ['HTML', 'CSS', 'JavaScript', 'Hosted locally in VS Code'],
      features: [
        'Personal "About Me" portfolio',
        'Clean and responsive layout',
        'Designed for a better user experience'
      ],
      tech: ['HTML', 'CSS', 'JavaScript']
    }
  };

  // Only use cards that have matching text in DATA
  const cards = $$('.project').filter(c => DATA[$('.card__title', c).textContent.trim()]);
  if (!cards.length) return;
  const names = cards.map(c => $('.card__title', c).textContent.trim());

  /* Build the pop-up once and add it to the page */
  const modal = document.createElement('div');
  modal.className = 'pmodal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'pmTitle');
  modal.innerHTML = `
    <div class="pmodal__backdrop" data-close></div>
    <article class="pmodal__panel" tabindex="-1">
      <button class="pmodal__close" data-close aria-label="Close project details">&times;</button>
      <header class="pmodal__head" id="pmHead">
        <span class="pmodal__date" id="pmDate"></span>
        <h3 class="pmodal__title" id="pmTitle"></h3>
      </header>
      <div class="pmodal__body" id="pmBody">
        <p class="pmodal__summary" id="pmSummary"></p>
        <h4 id="pmFlowTitle"></h4>
        <ol class="pflow" id="pmFlow"></ol>
        <h4>Key features</h4>
        <ul class="pfeat" id="pmFeat"></ul>
        <h4>Technologies used</h4>
        <ul class="ptags" id="pmTags"></ul>
        <div class="pmodal__nav">
          <button class="btn btn--ghost" id="pmPrev" type="button">Previous project</button>
          <button class="btn btn--primary" id="pmNext" type="button">Next project</button>
        </div>
      </div>
    </article>`;
  document.body.appendChild(modal);
  modal.setAttribute('aria-hidden', 'true');

  const panel = $('.pmodal__panel', modal);
  const body = $('#pmBody', modal);
  let current = 0;
  let lastFocus = null;

  // Turn a list into <li> items with an index (--i) used for the staggered animation
  const listHTML = items => items.map((text, i) => `<li style="--i:${i}">${text}</li>`).join('');

  function fill(index) {
    current = index;
    const d = DATA[names[index]];
    $('#pmHead', modal).dataset.color = d.color;
    $('#pmDate', modal).textContent = d.date;
    $('#pmTitle', modal).textContent = names[index];
    $('#pmSummary', modal).textContent = d.summary;
    $('#pmFlowTitle', modal).textContent = d.flowTitle;
    const flow = $('#pmFlow', modal);
    flow.className = 'pflow ' + (d.ordered ? 'pflow--steps' : 'pflow--chips');
    flow.innerHTML = listHTML(d.flow);
    $('#pmFeat', modal).innerHTML = listHTML(d.features);
    $('#pmTags', modal).innerHTML = listHTML(d.tech);
    panel.scrollTop = 0;

    // Restart the slide-in animations
    body.classList.remove('is-play');
    void body.offsetWidth;
    body.classList.add('is-play');
  }

  function open(index, trigger) {
    lastFocus = trigger || document.activeElement;
    fill(index);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';       // stop the page scrolling behind
    panel.focus();
  }

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  function step(direction) {
    fill((current + direction + names.length) % names.length);
  }

  /* Make each project card clickable (mouse, touch and keyboard) */
  cards.forEach((card, index) => {
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Show details of ' + names[index]);

    const hint = document.createElement('span');
    hint.className = 'project__hint';
    hint.textContent = 'Click to see details';
    $('.project__body', card).appendChild(hint);

    card.addEventListener('click', () => open(index, card));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(index, card); }
    });
  });

  /* Close and navigate */
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  $('#pmPrev', modal).addEventListener('click', () => step(-1));
  $('#pmNext', modal).addEventListener('click', () => step(1));

  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Tab') {                    // keep keyboard focus inside the pop-up
      const focusable = $$('button', modal);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
/* ---------- 13. PREMIUM EFFECTS ---------- */
(function premiumEffects() {
  // Mouse effects only make sense on desktop, and only if motion is allowed
  const desktopMotion = !isTouchDevice && !prefersReducedMotion;

  /* A. Scrolling skills strip under the hero (all skills are from the resume) */
  const hero = $('#home');
  if (hero) {
    const skills = ['Python', 'HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express.js', 'Git',
                    'GitHub', 'VS Code', 'Postman', 'MySQL', 'Pandas', 'NumPy', 'Matplotlib'];
    const colours = ['purple', 'blue', 'cyan', 'pink', 'orange'];
    const items = skills
      .map((name, i) => `<span class="marquee__item marquee__item--${colours[i % colours.length]}">${name}</span>`)
      .join('');
    const strip = document.createElement('div');
    strip.className = 'marquee';
    strip.setAttribute('aria-hidden', 'true');           // decorative: the real skills are in the Skills section
    strip.innerHTML = `<div class="marquee__track">${items}${items}</div>`;   // list twice for a seamless loop
    hero.after(strip);
  }

  /* B. Skill badges orbiting the profile photo */
  const photo = $('.photo');
  if (photo) {
    const badges = ['Python', 'HTML', 'CSS', 'JS', 'React', 'MySQL'];
    const orbit = document.createElement('div');
    orbit.className = 'orbit';
    orbit.setAttribute('aria-hidden', 'true');
    orbit.innerHTML = badges
      .map((name, i) => `<span class="orbit__badge" style="--a:${i * 60}deg"><span>${name}</span></span>`)
      .join('');
    photo.appendChild(orbit);
  }

  /* C. Spotlight on cards (works with the mouse only) */
  if (desktopMotion) {
    $$('.glow-border').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });
    });

    /* D. Soft glow that follows the mouse */
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    let targetX = 0, targetY = 0, glowX = 0, glowY = 0, visible = false;

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) { visible = true; glowX = targetX; glowY = targetY; glow.style.opacity = 1; }
    });
    document.addEventListener('mouseleave', () => { visible = false; glow.style.opacity = 0; });

    (function follow() {
      glowX += (targetX - glowX) * 0.12;                 // moves smoothly toward the mouse
      glowY += (targetY - glowY) * 0.12;
      glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
      requestAnimationFrame(follow);
    })();

    /* E. Buttons gently pull toward the cursor */
    $$('.btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.35;
        btn.style.translate = `${x}px ${y}px`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.translate = ''; });
    });
  }
})();
/* ---------- 14. INNOVATIVE CURSOR ---------- */
/* A glowing dot + comet tail + morphing ring + click sparks.
   Desktop with a mouse only. Touch screens and "reduced motion" keep the normal cursor. */
(function innovativeCursor() {
  const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!hasMouse || prefersReducedMotion) return;

  const root = document.documentElement;
  root.classList.add('has-cursor');                 // hides the normal cursor (see CSS)

  // Build the cursor pieces
  const canvas = document.createElement('canvas');
  canvas.className = 'cur-trail';
  const ring = document.createElement('div');
  ring.className = 'cur-ring';
  ring.innerHTML = '<div class="cur-ring__body"><span class="cur-ring__label"></span></div>';
  const dot = document.createElement('div');
  dot.className = 'cur-dot';
  document.body.append(canvas, ring, dot);

  const label = $('.cur-ring__label', ring);
  const ctx = canvas.getContext('2d');

  let w = 0, h = 0;
  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * ratio; canvas.height = h * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  let mx = -100, my = -100;      // mouse position
  let rx = -100, ry = -100;      // ring position (follows the mouse smoothly)
  let visible = false;

  const TAIL = 22;               // number of points in the comet tail
  const tail = Array.from({ length: TAIL }, () => ({ x: -100, y: -100 }));
  const sparks = [];
  const waves = [];

  /* Move */
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (!visible) {              // first movement: place everything under the mouse
      visible = true;
      rx = mx; ry = my;
      tail.forEach(p => { p.x = mx; p.y = my; });
      root.classList.add('cur-on');
    }
  });
  root.addEventListener('mouseleave', () => { visible = false; root.classList.remove('cur-on'); });

  /* Change shape depending on what is under the mouse */
  function setState(target) {
    let state = 'default', text = '';
    if (target.closest('input, textarea')) {
      state = 'text';                                             // normal text cursor shows here
    } else if (target.closest('.pmodal__backdrop, .pmodal__close')) {
      state = 'big'; text = 'Close';
    } else if (target.closest('.project')) {
      state = 'big'; text = 'Details';
    } else {
      const el = target.closest('a, button, [role="button"]');
      if (el) {
        if (el.hasAttribute('download')) { state = 'big'; text = 'Download'; }
        else if (el.target === '_blank') { state = 'big'; text = 'Visit'; }
        else state = 'link';
      }
    }
    root.dataset.cur = state;
    label.textContent = text;
  }
  document.addEventListener('mouseover', (e) => setState(e.target));

  /* Click: shrink the ring and burst sparks */
  document.addEventListener('mousedown', (e) => {
    root.classList.add('cur-down');
    waves.push({ x: e.clientX, y: e.clientY, r: 8, life: 1 });
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4.5;
      sparks.push({
        x: e.clientX, y: e.clientY,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3, life: 1,
        hue: 185 + Math.random() * 150                           // cyan to pink
      });
    }
  });
  document.addEventListener('mouseup', () => root.classList.remove('cur-down'));

  /* Animation loop */
  function loop(time) {
    rx += (mx - rx) * 0.2;
    ry += (my - ry) * 0.2;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;

    // Each tail point chases the one in front of it
    tail[0].x += (mx - tail[0].x) * 0.55;
    tail[0].y += (my - tail[0].y) * 0.55;
    for (let i = 1; i < TAIL; i++) {
      tail[i].x += (tail[i - 1].x - tail[i].x) * 0.42;
      tail[i].y += (tail[i - 1].y - tail[i].y) * 0.42;
    }

    ctx.clearRect(0, 0, w, h);

    // Comet tail (hidden over text fields)
    if (visible && root.dataset.cur !== 'text') {
      ctx.lineCap = 'round';
      for (let i = 0; i < TAIL - 1; i++) {
        const t = i / (TAIL - 1);
        const hue = 185 + 150 * (0.5 + 0.5 * Math.sin(time / 700 - i * 0.18));
        ctx.strokeStyle = `hsla(${hue}, 95%, 65%, ${(1 - t) * 0.85})`;
        ctx.shadowColor = `hsl(${hue}, 95%, 60%)`;
        ctx.shadowBlur = 14;
        ctx.lineWidth = (1 - t) * 7 + 0.5;
        ctx.beginPath();
        ctx.moveTo(tail[i].x, tail[i].y);
        ctx.lineTo(tail[i + 1].x, tail[i + 1].y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    // Shockwave rings from clicks
    for (let i = waves.length - 1; i >= 0; i--) {
      const wv = waves[i];
      wv.r += 3.4; wv.life -= 0.045;
      if (wv.life <= 0) { waves.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(34, 211, 238, ${wv.life * 0.8})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wv.x, wv.y, wv.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Sparks from clicks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.94; p.vy *= 0.94;
      p.life -= 0.03;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.fillStyle = `hsla(${p.hue}, 95%, 65%, ${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();