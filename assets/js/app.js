// ====== CONFIG ======
const CONFIG = {
  upiId: 'yourupi@oksbi',
  upiName: 'BattleZone Esports',
  currency: 'INR'
};

// ====== Supabase Setup (frontend anon key) ======
const { createClient } = window.supabase;
const supabase = createClient(
  'https://ebmsntitclqgjfvubzcl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVibXNudGl0Y2xxZ2pmdnViemNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2Mjk2MTYsImV4cCI6MjA2OTIwNTYxNn0.eQEwNT1-xaXszk5nPj2wCfDizJbkZObCX84BrDOPfP8'
);

// ====== Clear draft on real reload only (not from payment return) ======
window.addEventListener('load', () => {
  const form = document.getElementById('regForm');
  const isReturning = localStorage.getItem('returning_from_payment');
  if (form && !isReturning) {
    form.reset();
    localStorage.removeItem('bz_reg_form_draft'); // optional: reset draft
  }
  localStorage.removeItem('returning_from_payment');
});

// Sample events (edit these)
const events = [
  {
    id: 'ev1',
    title: 'PUBG Mobile Squad Cup',
    date: '2025-08-10T18:00:00+05:30',
    banner: '/assets/img/poster1.jpg',
    entryFee: 200,
    prizePool: 2000,
    map: 'Erangel',
    maxTeams: 25
  },
  {
    id: 'ev2',
    title: 'PUBG Mobile Scrims — Friday Rush',
    date: '2025-08-15T21:00:00+05:30',
    banner: '/assets/img/poster2.jpg',
    entryFee: 100,
    prizePool: 1000,
    map: 'Miramar',
    maxTeams: 25
  }
];

// ====== DOM ======
const eventsGrid   = document.getElementById('events-grid');
const eventSelect  = document.getElementById('eventId');
const entryFeeEl   = document.getElementById('entryFee');
const regForm      = document.getElementById('regForm');
const toastEl      = document.getElementById('toast');
const yearEl       = document.getElementById('year');
const nav          = document.querySelector('.nav');
const hamburger    = document.getElementById('hamburger');

// Canvas (guard if not present)
const canvas = document.getElementById('bg-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];

// ====== Persist registration draft ======
const FORM_STORAGE_KEY = 'bz_reg_form_draft';

function saveDraft() {
  if (!regForm) return;

  const evId     = eventSelect?.value || '';
  const teamName = document.getElementById('teamName')?.value || '';
  const email    = document.getElementById('email')?.value || '';
  const phone    = document.getElementById('phone')?.value || '';
  const txnId    = document.getElementById('txnId')?.value || '';

  const playerNames = Array.from(document.querySelectorAll('.player-name')).map(i => i.value || '');
  const playerIds   = Array.from(document.querySelectorAll('.player-id')).map(i => i.value || '');

  const draft = { evId, teamName, email, phone, txnId, playerNames, playerIds };
  localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(draft));
}

function restoreDraft() {
  if (!regForm) return;
  const raw = localStorage.getItem(FORM_STORAGE_KEY);
  if (!raw) return;

  try {
    const d = JSON.parse(raw);

    if (eventSelect && d.evId) {
      eventSelect.value = d.evId;
      handleEntryFee();
    }
    if (d.teamName) document.getElementById('teamName').value = d.teamName;
    if (d.email)    document.getElementById('email').value = d.email;
    if (d.phone)    document.getElementById('phone').value = d.phone;
    if (d.txnId)    document.getElementById('txnId').value = d.txnId;

    const pn = Array.from(document.querySelectorAll('.player-name'));
    const pi = Array.from(document.querySelectorAll('.player-id'));
    pn.forEach((el, i) => el.value = d.playerNames?.[i] ?? '');
    pi.forEach((el, i) => el.value = d.playerIds?.[i] ?? '');
  } catch (e) {
    console.warn('Failed to parse saved draft', e);
  }
}

function clearDraft() {
  localStorage.removeItem(FORM_STORAGE_KEY);
}

function debounce(fn, delay = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}
const saveDraftDebounced = debounce(saveDraft, 200);

// ====== Canvas Particles ======
function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
if (canvas) {
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
}

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + .5;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.alpha = Math.random() * 0.6 + 0.2;
    this.color = `rgba(255,159,28,${this.alpha})`;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.reset();
    }
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initParticles() {
  if (!canvas) return;
  particles = [];
  const count = Math.min(180, Math.floor(canvas.width * canvas.height / 8000));
  for (let i = 0; i < count; i++) particles.push(new Particle());
}
function animate() {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animate);
}
if (canvas) {
  initParticles();
  animate();
}

// ====== Helpers ======
function showToast(msg, type = 'info') {
  if (!toastEl) { alert(msg); return; }
  toastEl.textContent = msg;
  toastEl.style.background = type === 'error' ? '#d73030' : '#111';
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 3000);
}

function saveRegistration(data) {
  const key = 'bz_registrations';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.push(data);
  localStorage.setItem(key, JSON.stringify(arr));
}

function formatDate(date) {
  return new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short'
  });
}

function getCountdown(target) {
  const now = new Date().getTime();
  const t = new Date(target).getTime();
  const diff = t - now;
  if (diff <= 0) return 'Started';
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${d}d ${h}h ${m}m`;
}

function updateCountdowns() {
  document.querySelectorAll('[data-countdown]')
    .forEach(el => {
      const date = el.getAttribute('data-countdown');
      el.textContent = getCountdown(date);
    });
}
setInterval(updateCountdowns, 60 * 1000);

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('show'); observer.unobserve(e.target); }
  })
}, { threshold: 0.1 });

// ====== Render Events ======
function renderEvents() {
  if (!eventsGrid) return;
  eventsGrid.innerHTML = events.map(e => {
    return `
      <article class="event-card reveal">
        <img src="${e.banner}" alt="${e.title}" class="event-banner" />
        <div class="event-body">
          <h3>${e.title}</h3>
          <div class="event-meta">
            <span>${formatDate(e.date)}</span>
            <span class="countdown" data-countdown="${e.date}"></span>
          </div>
          <p>Entry: <strong>₹${e.entryFee}</strong> • Prize Pool: <strong>₹${e.prizePool}</strong></p>
          <p>Map: ${e.map} • Max Teams: ${e.maxTeams}</p>
          <a href="#register" class="btn btn-small btn-outline" data-ev="${e.id}">Register</a>
        </div>
      </article>
    `;
  }).join('');

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  eventsGrid.querySelectorAll('[data-ev]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const id = ev.currentTarget.getAttribute('data-ev');
      if (eventSelect) {
        eventSelect.value = id;
        handleEntryFee();
        saveDraftDebounced();
      }
    });
  });

  updateCountdowns();
}

// ====== Populate Select ======
function populateEventSelect() {
  if (!eventSelect) return;
  eventSelect.innerHTML = '<option value="" disabled selected>Select an event</option>' +
    events.map(e => `<option value="${e.id}">${e.title} — ₹${e.entryFee}</option>`).join('');
}

function handleEntryFee() {
  const ev = events.find(e => e.id === eventSelect.value);
  entryFeeEl.textContent = ev ? `₹${ev.entryFee}` : '—';
}

// ====== Submit Registration to Supabase ======
if (regForm) {
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const evId     = eventSelect.value;
    const evData   = events.find(e => e.id === evId);
    const teamName = document.getElementById('teamName').value.trim();
    const email    = document.getElementById('email').value.trim();
    const phone    = document.getElementById('phone').value.trim();
    const txnId    = document.getElementById('txnId').value.trim();

    const playerNames = Array.from(document.querySelectorAll('.player-name')).map(i => i.value.trim());
    const playerIds   = Array.from(document.querySelectorAll('.player-id')).map(i => i.value.trim());

    if (!evId) return showToast('Please select an event', 'error');
    if (!teamName) return showToast('Enter team name', 'error');
    if (playerNames.some(n => !n) || playerIds.some(id => !id)) return showToast('Fill all player names & IDs', 'error');
    if (playerNames.length !== 4 || playerIds.length !== 4) return showToast('Exactly 4 players required', 'error');
    if (!email) return showToast('Enter email', 'error');
    if (!/^\d{10}$/.test(phone)) return showToast('Enter valid 10-digit phone', 'error');
    if (!txnId) return showToast('Enter UPI transaction ID', 'error');

    const members = playerNames.map((name, i) => ({ name, pubg_id: playerIds[i] }));

    const payload = {
      team_name: teamName,
      event_id: evId,
      event_title: evData.title,
      email,
      phone,
      txn_id: txnId,
      fee: evData.entryFee,
      members,
      created_at: new Date().toISOString(),
      status: 'pending'
    };

    const { error } = await supabase.from('teams').insert([payload]);

    if (error) {
      return showToast('Registration failed: ' + error.message, 'error');
    }

    clearDraft(); // remove saved draft once submitted successfully
    regForm.reset();
    eventSelect.value = '';
    handleEntryFee();
    showToast('Registered successfully!');
  });
}

// ====== Nav & Misc ======
if (hamburger) {
  hamburger.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    nav.classList.remove('open');
  });
});

document.querySelectorAll('.acc-header').forEach(h => {
  h.addEventListener('click', () => {
    const item = h.parentElement;
    item.classList.toggle('active');
  });
});

// Reveal initial elements
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});

// // Clear form data on full page reload
// window.addEventListener('load', () => {
//   const form = document.getElementById('regForm');
//   if (form) form.reset();
// });


// Year
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// ====== Init ======
renderEvents();
populateEventSelect();
restoreDraft();            // <-- restore saved form values here
handleEntryFee();
updateCountdowns();

// Auto-save on input/select change
if (regForm) {
  regForm.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', saveDraftDebounced);
    el.addEventListener('change', saveDraftDebounced);
  });

  // Save before going to payment page
  const payNowLink = regForm.querySelector('a[href="payment.html"]');
  if (payNowLink) {
    payNowLink.addEventListener('click', saveDraft);
  }
}
