const CONFIG = {
  weddingDateISO: "2026-08-06T00:00:00+08:00",
  akad: {
    title: "Akad Nikah — Achmad & Suci",
    start: "20260806",
    end: "20260807",
    location: "Balai Kartini, Kabupaten Bantaeng",
    details: "Akad nikah Achmad Amzal Maulana, S.H.Int., M.I.P dan Suci Ainun A. Said, S.Pi. Waktu pelaksanaan akan diinformasikan kemudian."
  },
  resepsi: {
    title: "Resepsi Pernikahan — Achmad & Suci",
    start: "20260808",
    end: "20260809",
    location: "Four Point by Sheraton Hotel, Kota Makassar",
    details: "Resepsi pernikahan Achmad Amzal Maulana, S.H.Int., M.I.P dan Suci Ainun A. Said, S.Pi. Waktu pelaksanaan akan diinformasikan kemudian."
  }
};

const params = new URLSearchParams(window.location.search);
const guest = params.get("to");
if (guest) {
  document.getElementById("guestName").textContent = guest.trim() || "Tamu Undangan";
}

const cover = document.getElementById("cover");
const openButton = document.getElementById("openBtn");
document.body.style.overflow = "hidden";
openButton.addEventListener("click", () => {
  cover.classList.add("open");
  document.body.style.overflow = "auto";
  window.setTimeout(() => document.getElementById("hero").scrollIntoView(), 450);
});

function updateCountdown() {
  const target = new Date(CONFIG.weddingDateISO).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const minutes = Math.floor((diff / 60000) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  document.getElementById("cd-d").textContent = String(days).padStart(2, "0");
  document.getElementById("cd-h").textContent = String(hours).padStart(2, "0");
  document.getElementById("cd-m").textContent = String(minutes).padStart(2, "0");
  document.getElementById("cd-s").textContent = String(seconds).padStart(2, "0");
}
updateCountdown();
window.setInterval(updateCountdown, 1000);

function googleCalendarLink(event) {
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const query = new URLSearchParams({
    text: event.title,
    dates: `${event.start}/${event.end}`,
    location: event.location,
    details: event.details,
    ctz: "Asia/Makassar"
  });
  return `${base}&${query.toString()}`;
}
document.getElementById("cal-akad").href = googleCalendarLink(CONFIG.akad);
document.getElementById("cal-resepsi").href = googleCalendarLink(CONFIG.resepsi);

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("in");
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

const STORAGE_KEY = "achmad-suci-wishes";
const wishlist = document.getElementById("wishlist");
const rsvpForm = document.getElementById("rsvpForm");
const rsvpMessage = document.getElementById("rsvp-msg");
const clearWishes = document.getElementById("clearWishes");

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}

function getWishes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveWishes(wishes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
}

function renderWishes() {
  const wishes = getWishes();
  if (!wishes.length) {
    wishlist.innerHTML = '<p class="empty-wishes">Jadilah yang pertama mengirim ucapan dan doa ✦</p>';
    clearWishes.hidden = true;
    return;
  }
  clearWishes.hidden = false;
  wishlist.innerHTML = wishes.map((wish) => `
    <article class="wish">
      <div class="wish-head">
        <span class="who">${escapeHtml(wish.name)}</span>
        <span class="status">${escapeHtml(wish.status)}</span>
      </div>
      <div class="event">${escapeHtml(wish.event)}</div>
      <p>${escapeHtml(wish.message || "Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.")}</p>
    </article>
  `).join("");
}

rsvpForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(rsvpForm);
  const entry = {
    name: String(data.get("name") || "").trim(),
    event: String(data.get("event") || "Keduanya"),
    status: String(data.get("status") || "Hadir"),
    message: String(data.get("message") || "").trim(),
    createdAt: Date.now()
  };
  if (!entry.name) {
    rsvpMessage.textContent = "Mohon isi nama terlebih dahulu.";
    return;
  }
  const wishes = getWishes();
  wishes.unshift(entry);
  saveWishes(wishes.slice(0, 50));
  renderWishes();
  rsvpForm.reset();
  rsvpMessage.textContent = "Terima kasih. Konfirmasi dan ucapan Anda telah tersimpan pada perangkat ini ✦";
});

clearWishes.addEventListener("click", () => {
  const confirmed = window.confirm("Hapus seluruh ucapan yang tersimpan pada perangkat ini?");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  renderWishes();
  rsvpMessage.textContent = "Daftar ucapan pada perangkat ini telah dibersihkan.";
});
renderWishes();

let audioContext;
let playing = false;
let audioNodes = [];
const musicButton = document.getElementById("music-toggle");

function startAmbient() {
  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  const master = audioContext.createGain();
  master.gain.setValueAtTime(0.035, audioContext.currentTime);
  master.connect(audioContext.destination);
  [220, 277.18, 329.63].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.17, audioContext.currentTime + 1.2 + index * 0.25);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start();
    audioNodes.push({ oscillator, gain });
  });
  audioNodes.push({ master });
}

function stopAmbient() {
  if (!audioContext) return;
  audioNodes.forEach((node) => {
    if (node.gain) node.gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
    if (node.oscillator) node.oscillator.stop(audioContext.currentTime + 0.65);
  });
  audioNodes = [];
}

musicButton.addEventListener("click", async () => {
  if (!playing) {
    startAmbient();
    if (audioContext.state === "suspended") await audioContext.resume();
    musicButton.classList.add("playing");
  } else {
    stopAmbient();
    musicButton.classList.remove("playing");
  }
  playing = !playing;
});
