/* ============ CONFIG — ganti sesuai data kalian ============ */
const CONFIG = {
  weddingDateISO: "2026-11-14T08:00:00+08:00",
  akad:    { title: "Akad Nikah — Ratna & Bagas", start:"20261114T000000Z", end:"20261114T020000Z", location:"Jl. Melati No. 12, Makassar" },
  resepsi: { title: "Resepsi Pernikahan — Ratna & Bagas", start:"20261114T030000Z", end:"20261114T060000Z", location:"Gedung Serbaguna Anggrek, Makassar" },
  story: [
    { year:"2019", title:"Pertama Bertemu", text:"Dipertemukan dalam satu forum organisasi kampus, obrolan singkat itu ternyata berlanjut jadi pertemuan-pertemuan berikutnya." },
    { year:"2021", title:"Mulai Dekat", text:"Dari teman diskusi jadi teman jalan. Perlahan kami sadar ingin melewati lebih banyak hal bersama." },
    { year:"2023", title:"Lamaran", text:"Direstui kedua keluarga, janji untuk melangkah ke jenjang yang lebih serius resmi terucap." },
    { year:"2026", title:"Hari Bahagia", text:"Dan hari yang dinanti itu pun tiba — kami mengundang Anda untuk menjadi saksi." }
  ],
  galleryCount: 6
};

/* ============ Guest name from URL (?to=Nama) ============ */
const params = new URLSearchParams(window.location.search);
const guest = params.get('to');
if(guest){ document.getElementById('guestName').textContent = decodeURIComponent(guest); }

/* ============ Cover open ============ */
document.body.style.overflow = 'hidden';
document.getElementById('openBtn').addEventListener('click', () => {
  document.getElementById('cover').classList.add('open');
  document.body.style.overflow = 'auto';
});

/* ============ Countdown ============ */
function updateCountdown(){
  const target = new Date(CONFIG.weddingDateISO).getTime();
  const now = Date.now();
  let diff = Math.max(0, target - now);
  const d = Math.floor(diff / (1000*60*60*24));
  const h = Math.floor((diff / (1000*60*60)) % 24);
  const m = Math.floor((diff / (1000*60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  document.getElementById('cd-d').textContent = String(d).padStart(2,'0');
  document.getElementById('cd-h').textContent = String(h).padStart(2,'0');
  document.getElementById('cd-m').textContent = String(m).padStart(2,'0');
  document.getElementById('cd-s').textContent = String(s).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ============ Add to calendar links ============ */
function gcalLink(ev){
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  return `${base}&text=${encodeURIComponent(ev.title)}&dates=${ev.start}/${ev.end}&location=${encodeURIComponent(ev.location)}`;
}
document.getElementById('cal-akad').href = gcalLink(CONFIG.akad);
document.getElementById('cal-resepsi').href = gcalLink(CONFIG.resepsi);

/* ============ Love story render ============ */
const storyList = document.getElementById('story-list');
CONFIG.story.forEach((item, i) => {
  const el = document.createElement('div');
  el.className = 'story-item';
  el.innerHTML = `
    <div class="story-dot">${i+1}<div class="story-line"></div></div>
    <div class="story-text">
      <div class="yr">${item.year}</div>
      <h3>${item.title}</h3>
      <p>${item.text}</p>
    </div>`;
  storyList.appendChild(el);
});

/* ============ Gallery placeholders ============ */
const grid = document.getElementById('galleryGrid');
const symbols = ['✦','❦','✿','☙','✦','❧'];
for(let i=0;i<CONFIG.galleryCount;i++){
  const c = document.createElement('div');
  c.className = 'gcell';
  c.textContent = symbols[i % symbols.length];
  grid.appendChild(c);
}

/* ============ Copy account number ============ */
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const val = btn.getAttribute('data-copy');
    try{
      await navigator.clipboard.writeText(val);
      const old = btn.textContent;
      btn.textContent = 'Tersalin ✓';
      setTimeout(()=> btn.textContent = old, 1800);
    }catch(e){
      alert('Nomor rekening: ' + val);
    }
  });
});

/* ============ Scroll reveal ============ */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); } });
}, {threshold:0.15});
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ============ RSVP + Wishes via persistent storage ============ */
const wishlistEl = document.getElementById('wishlist');

async function loadWishes(){
  wishlistEl.innerHTML = '<p style="text-align:center;font-size:0.8rem;color:var(--ink-soft);">Memuat ucapan...</p>';
  try{
    const list = await window.storage.list('wish:', true);
    if(!list || !list.keys || list.keys.length === 0){
      wishlistEl.innerHTML = '<p style="text-align:center;font-size:0.85rem;color:var(--ink-soft);">Jadilah yang pertama mengirim ucapan ✦</p>';
      return;
    }
    const items = [];
    for(const k of list.keys){
      try{
        const res = await window.storage.get(k, true);
        if(res && res.value) items.push(JSON.parse(res.value));
      }catch(e){ /* skip missing */ }
    }
    items.sort((a,b)=> (b.ts||0) - (a.ts||0));
    wishlistEl.innerHTML = '';
    items.forEach(w => {
      const div = document.createElement('div');
      div.className = 'wish';
      div.innerHTML = `<span class="who">${escapeHtml(w.name)}</span><span class="status">${escapeHtml(w.status)}</span><p>${escapeHtml(w.message || '(tanpa pesan)')}</p>`;
      wishlistEl.appendChild(div);
    });
  }catch(e){
    wishlistEl.innerHTML = '<p style="text-align:center;font-size:0.8rem;color:var(--ink-soft);">Buku tamu belum tersedia saat ini.</p>';
  }
}
function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
loadWishes();

document.getElementById('rsvpForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const name = document.getElementById('r-name').value.trim();
  const status = document.getElementById('r-status').value;
  const count = document.getElementById('r-count').value;
  const message = document.getElementById('r-msg').value.trim();
  const msgEl = document.getElementById('rsvp-msg');
  if(!name){ msgEl.textContent = 'Mohon isi nama terlebih dahulu.'; return; }

  const entry = { name, status, count, message, ts: Date.now() };
  const key = 'wish:' + Date.now() + '-' + Math.random().toString(36).slice(2,8);
  msgEl.textContent = 'Mengirim...';
  try{
    const result = await window.storage.set(key, JSON.stringify(entry), true);
    if(result){
      msgEl.textContent = 'Terima kasih! Konfirmasi Anda telah kami terima ✦';
      document.getElementById('rsvpForm').reset();
      loadWishes();
    }else{
      msgEl.textContent = 'Gagal mengirim, silakan coba lagi.';
    }
  }catch(err){
    msgEl.textContent = 'Gagal mengirim, silakan coba lagi.';
  }
});

/* ============ Ambient "vinyl" background music (generative, no external file) ============ */
let audioCtx, playing = false, nodes = [];
document.getElementById('music-toggle').addEventListener('click', () => {
  if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  const btn = document.getElementById('music-toggle');
  if(!playing){
    startAmbient();
    btn.classList.add('playing');
  }else{
    stopAmbient();
    btn.classList.remove('playing');
  }
  playing = !playing;
});
function startAmbient(){
  const master = audioCtx.createGain();
  master.gain.value = 0.05;
  master.connect(audioCtx.destination);
  const chord = [220, 277.18, 329.63]; // gentle A major-ish pad
  chord.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = audioCtx.createGain();
    g.gain.value = 0;
    osc.connect(g); g.connect(master);
    osc.start();
    g.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 1.5 + i*0.3);
    nodes.push({osc, g});
  });
  nodes.push({master});
}
function stopAmbient(){
  nodes.forEach(n => {
    if(n.g){ n.g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6); }
    if(n.osc){ n.osc.stop(audioCtx.currentTime + 0.8); }
  });
  nodes = [];
}