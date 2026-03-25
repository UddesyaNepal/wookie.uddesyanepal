/* ══════════════════════════════════════════════════════
   PORTFOLIO — main.js
   Handles: cursor · nav · reveal · skill bars · 
            char counter · pipeline anim · MongoDB Contact
   ══════════════════════════════════════════════════════ */

// ── 1. Custom Cursor ────────────────────────────────────────────────────────────
const dot  = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');

let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  if(dot) {
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  }
});

(function animRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  if(ring) {
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
  }
  requestAnimationFrame(animRing);
})();

document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => ring?.classList.add('big'));
  el.addEventListener('mouseleave', () => ring?.classList.remove('big'));
});

// ── 2. Nav scroll ───────────────────────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if(nav) nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── 3. Scroll-reveal ────────────────────────────────────────────────────────────
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

// ── 4. Skill bars ───────────────────────────────────────────────────────────────
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

// ── 5. Project card colors ─────────────────────────────────────────────────────
document.querySelectorAll('.project-card[data-color]').forEach(card => {
  card.style.setProperty('--card-color', card.dataset.color);
});

// ── 6. Pipeline animation ───────────────────────────────────────────────────────
const pipes = document.querySelectorAll('.pipe-step');
let pipeIdx = 0;
if (pipes.length) {
  setInterval(() => {
    pipes.forEach(p => p.classList.remove('active'));
    pipes[pipeIdx % pipes.length].classList.add('active');
    pipeIdx++;
  }, 850);
}

// ── 7. Char counter ─────────────────────────────────────────────────────────────
const bodyField = document.getElementById('body');
const charCount = document.getElementById('charCount');
if (bodyField && charCount) {
  bodyField.addEventListener('input', () => {
    const n = bodyField.value.length;
    charCount.textContent = `${n} / 2000`;
    charCount.style.color = n > 1800 ? 'var(--terracotta)' : 'var(--muted)';
  });
}

// ── 8. MONGODB CONTACT FORM HANDLER ───────────────────────────────────────────
const contactForm = document.getElementById('contactForm');
const formStatus  = document.getElementById('formStatus');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Change button to "Sending..."
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = "Sending... ✦";
    submitBtn.disabled = true;

    // Collect data from the form
    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      subject: document.getElementById('subject').value,
      body: document.getElementById('body').value
    };

    try {
      // Send data to our Python/MongoDB backend
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.ok) {
        // Success!
        formStatus.innerHTML = `<div style="color: #2e7d32; padding: 10px; background: #e8f5e9; border-radius: 5px; margin-top: 10px;">✅ ${result.message}</div>`;
        contactForm.reset(); 
      } else {
        // Show validation errors (e.g., email too short)
        let errorMsg = Object.values(result.errors).join(' | ');
        formStatus.innerHTML = `<div style="color: #d32f2f; padding: 10px; background: #ffebee; border-radius: 5px; margin-top: 10px;">❌ ${errorMsg}</div>`;
      }
    } catch (error) {
      formStatus.innerHTML = `<div style="color: #d32f2f; padding: 10px; background: #ffebee; border-radius: 5px; margin-top: 10px;">❌ Server Connection Failed.</div>`;
    } finally {
      // Reset button
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  });
}

console.log('%c📦 Portfolio Pipeline Ready', 'color:#C4622D;font-family:monospace;font-size:13px;font-weight:bold');
console.log('%cStack: Flask + MongoDB Atlas + HTML/CSS/JS', 'color:#8A7E72;font-family:monospace;font-size:11px');