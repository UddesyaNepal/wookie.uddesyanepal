/* ══════════════════════════════════════════════════════
   PORTFOLIO — main.js
   Handles: cursor · nav · reveal · skill bars ·
            char counter · form submission · pipeline anim
   ══════════════════════════════════════════════════════ */

// ── Custom Cursor ────────────────────────────────────────────────────────────
const dot  = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');

let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  dot.style.left = mx + 'px';
  dot.style.top  = my + 'px';
});

(function animRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(animRing);
})();

document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => ring.classList.add('big'));
  el.addEventListener('mouseleave', () => ring.classList.remove('big'));
});

// ── Nav scroll ───────────────────────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── Scroll-reveal ────────────────────────────────────────────────────────────
document.querySelectorAll(
  '.project-card, .about-grid, .skills-grid, .pipe-step, .contact-grid, .about-facts'
).forEach(el => el.classList.add('reveal'));

const revObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const siblings = entry.target.parentElement
      ? [...entry.target.parentElement.children] : [];
    const delay = siblings.includes(entry.target)
      ? siblings.indexOf(entry.target) * 80 : 0;
    setTimeout(() => entry.target.classList.add('visible'), delay);
    revObs.unobserve(entry.target);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

// ── Skill bars ───────────────────────────────────────────────────────────────
const barObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const bar = entry.target;
    bar.style.setProperty('--bar-w', bar.dataset.w + '%');
    bar.classList.add('animated');
    barObs.unobserve(bar);
  });
}, { threshold: 0.5 });

document.querySelectorAll('.skill-bar[data-w]').forEach(b => barObs.observe(b));

// ── Project card colours ─────────────────────────────────────────────────────
document.querySelectorAll('.project-card[data-color]').forEach(card => {
  card.style.setProperty('--card-color', card.dataset.color);
});

// ── Pipeline animation ───────────────────────────────────────────────────────
const pipes = document.querySelectorAll('.pipe-step');
let pipeIdx = 0;
if (pipes.length) {
  setInterval(() => {
    pipes.forEach(p => p.classList.remove('active'));
    pipes[pipeIdx % pipes.length].classList.add('active');
    pipeIdx++;
  }, 850);
}

// ── Char counter ─────────────────────────────────────────────────────────────
const bodyField = document.getElementById('body');
const charCount = document.getElementById('charCount');
if (bodyField && charCount) {
  bodyField.addEventListener('input', () => {
    const n = bodyField.value.length;
    charCount.textContent = `${n} / 2000`;
    charCount.style.color = n > 1800 ? 'var(--terracotta)' : 'var(--muted)';
  });
}

// ── Contact Form ─────────────────────────────────────────────────────────────
const form       = document.getElementById('contactForm');
const submitBtn  = document.getElementById('submitBtn');
const btnText    = submitBtn && submitBtn.querySelector('.btn-text');
const btnIcon    = submitBtn && submitBtn.querySelector('.btn-icon');
const btnLoader  = document.getElementById('btnLoader');
const formStatus = document.getElementById('formStatus');

function showStatus(msg, type) {
  formStatus.textContent = msg;
  formStatus.className   = 'form-status show ' + type;
}
function clearStatus() {
  formStatus.className   = 'form-status';
  formStatus.textContent = '';
}
function setLoading(on) {
  submitBtn.disabled = on;
  if (btnLoader) btnLoader.classList.toggle('show', on);
  if (btnText)   btnText.style.opacity = on ? '0.5' : '1';
  if (btnIcon)   btnIcon.style.opacity = on ? '0'   : '1';
}

if (form) {
  /* Clear field errors on typing */
  form.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', () => { el.classList.remove('error'); clearStatus(); });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearStatus();

    const nameEl    = document.getElementById('name');
    const emailEl   = document.getElementById('email');
    const subjectEl = document.getElementById('subject');
    const bodyEl    = document.getElementById('body');

    /* Client-side pre-check */
    let ok = true;
    [nameEl, emailEl, subjectEl, bodyEl].forEach(f => {
      if (!f.value.trim()) { f.classList.add('error'); ok = false; }
    });
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailEl.value && !emailRx.test(emailEl.value)) {
      emailEl.classList.add('error'); ok = false;
    }
    if (!ok) {
      showStatus('Please fill in all required fields correctly.', 'err');
      return;
    }

    setLoading(true);

    const payload = {
      name:    nameEl.value.trim(),
      email:   emailEl.value.trim(),
      subject: subjectEl.value.trim(),
      body:    bodyEl.value.trim()
    };

    try {
      const res  = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.ok) {
        showStatus('✓ ' + data.message, 'success');
        form.reset();
        if (charCount) charCount.textContent = '0 / 2000';
      } else {
        /* Show first server-side error */
        const firstErr = data.errors
          ? Object.values(data.errors)[0]
          : 'Something went wrong. Please try again.';
        showStatus('✗ ' + firstErr, 'err');
      }
    } catch (_) {
      /* Backend not running — demo mode */
      showStatus('✓ [Demo] Message queued! Run Flask to store in SQLite.', 'success');
      form.reset();
      if (charCount) charCount.textContent = '0 / 2000';
    } finally {
      setLoading(false);
      formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

console.log('%c📦 Portfolio Pipeline Ready', 'color:#C4622D;font-family:monospace;font-size:13px;font-weight:bold');
console.log('%cStack: Flask + SQLite + HTML/CSS/JS', 'color:#8A7E72;font-family:monospace;font-size:11px');