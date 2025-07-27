// ====== CONFIG ======
const CONFIG = {
  upiId: 'yourupi@oksbi', // <-- REPLACE
  upiName: 'BattleZone Esports',
  currency: 'INR'
};

// Sample events (edit these)
const events = [
  {
    id: 'ev1',
    title: 'PUBG Mobile Squad Cup #1',
    date: '2025-08-10T18:00:00+05:30', // IST
    banner: 'assets/img/banner1.jpg',
    entryFee: 200,
    prizePool: 2000,
    map: 'Erangel',
    maxTeams: 25
  },
  {
    id: 'ev2',
    title: 'PUBG Mobile Scrims — Friday Rush',
    date: '2025-08-15T21:00:00+05:30',
    banner: 'assets/img/banner2.jpg',
    entryFee: 100,
    prizePool: 1000,
    map: 'Miramar',
    maxTeams: 25
  }
];

// ====== DOM ======
const eventsGrid = document.getElementById('events-grid');
const eventSelect = document.getElementById('eventId');
const entryFeeEl = document.getElementById('entryFee');
const regForm = document.getElementById('regForm');
const toastEl = document.getElementById('toast');
const yearEl = document.getElementById('year');
const nav = document.querySelector('.nav');
const hamburger = document.getElementById('hamburger');

// Hero canvas particles
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
  constructor(){
    this.reset();
  }
  reset(){
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + .5;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.alpha = Math.random() * 0.6 + 0.2;
    this.color = `rgba(255,159,28,${this.alpha})`;
  }
  update(){
    this.x += this.speedX;
    this.y += this.speedY;
    if(this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height){
      this.reset();
    }
  }
  draw(){
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initParticles(){
  particles = [];
  const count = Math.min(180, Math.floor(canvas.width * canvas.height / 8000));
  for(let i=0;i<count;i++) particles.push(new Particle());
}
initParticles();

function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{ p.update(); p.draw(); });
  requestAnimationFrame(animate);
}
animate();

// ====== Helpers ======
function showToast(msg, type = 'info'){
  toastEl.textContent = msg;
  toastEl.style.background = type === 'error' ? '#d73030' : '#111';
  toastEl.classList.add('show');
  setTimeout(()=> toastEl.classList.remove('show'), 3000);
}

function saveRegistration(data){
  const key = 'bz_registrations';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.push(data);
  localStorage.setItem(key, JSON.stringify(arr));
}

function formatDate(date){
  return new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short'
  });
}

function getCountdown(target){
  const now = new Date().getTime();
  const t = new Date(target).getTime();
  const diff = t - now;
  if(diff <= 0) return 'Started';
  const d = Math.floor(diff / (1000*60*60*24));
  const h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  const m = Math.floor((diff % (1000*60*60)) / (1000*60));
  return `${d}d ${h}h ${m}m`;
}

function updateCountdowns(){
  document.querySelectorAll('[data-countdown]')
    .forEach(el => {
      const date = el.getAttribute('data-countdown');
      el.textContent = getCountdown(date);
    });
}
setInterval(updateCountdowns, 60 * 1000);

// Reveal on scroll
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(e => {
    if(e.isIntersecting){ e.target.classList.add('show'); observer.unobserve(e.target); }
  })
},{ threshold: 0.1 });

// ====== Render Events ======
function renderEvents(){
  if(!eventsGrid) return;
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

  // reveal attach
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // attach quick-register buttons
  eventsGrid.querySelectorAll('[data-ev]').forEach(btn => {
    btn.addEventListener('click', (ev)=>{
      const id = ev.currentTarget.getAttribute('data-ev');
      if(eventSelect){
        eventSelect.value = id;
        handleEntryFee();
      }
    })
  });

  updateCountdowns();
}

// ====== Populate Select ======
function populateEventSelect(){
  if(!eventSelect) return;
  eventSelect.innerHTML = '<option value="" disabled selected>Select an event</option>' +
    events.map(e => `<option value="${e.id}">${e.title} — ₹${e.entryFee}</option>`).join('');
}

function handleEntryFee(){
  const ev = events.find(e => e.id === eventSelect.value);
  entryFeeEl.textContent = ev ? `₹${ev.entryFee}` : '—';
}

// ====== Form Submit ======
if(regForm){
  regForm.addEventListener('submit', (e)=>{
    e.preventDefault();

    const evId = eventSelect.value;
    const evData = events.find(e => e.id === evId);
    const teamName = document.getElementById('teamName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const txnId = document.getElementById('txnId').value.trim();

    const playerNames = Array.from(document.querySelectorAll('.player-name')).map(i=> i.value.trim());
    const playerIds   = Array.from(document.querySelectorAll('.player-id')).map(i=> i.value.trim());

    if(!evId){ return showToast('Please select an event', 'error'); }
    if(!teamName){ return showToast('Enter team name', 'error'); }
    if(playerNames.some(n => !n) || playerIds.some(id => !id)){
      return showToast('Fill all player names & IDs', 'error');
    }
    if(playerNames.length !== 4 || playerIds.length !== 4){
      return showToast('Exactly 4 players required', 'error');
    }
    if(!email){ return showToast('Enter email', 'error'); }
    if(!/^\d{10}$/.test(phone)){
      return showToast('Enter valid 10-digit phone', 'error');
    }
    if(!txnId){ return showToast('Enter UPI transaction ID', 'error'); }

    const payload = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      eventId: evId,
      eventTitle: evData?.title ?? '',
      fee: evData?.entryFee ?? 0,
      teamName,
      email,
      phone,
      txnId,
      members: playerNames.map((name, i)=>({ name, pubgId: playerIds[i] })),
      status: 'pending'
    };

    saveRegistration(payload);
    regForm.reset();
    eventSelect.value = '';
    handleEntryFee();

    showToast('Registered! We will verify payment & contact you.');
  });
}

// ====== Nav & Misc ======
if(hamburger){
  hamburger.addEventListener('click', ()=>{
    nav.classList.toggle('open');
  });
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-link').forEach(l=> l.classList.remove('active'));
    link.classList.add('active');
    nav.classList.remove('open');
  });
});

document.querySelectorAll('.acc-header').forEach(h => {
  h.addEventListener('click', ()=>{
    const item = h.parentElement;
    item.classList.toggle('active');
  });
});

// reveal initial elements
window.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});

// Year
if(yearEl){
  yearEl.textContent = new Date().getFullYear();
}

// Init
renderEvents();
populateEventSelect();
handleEntryFee();
updateCountdowns();