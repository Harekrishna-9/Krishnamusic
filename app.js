const DEFAULT_PLAYLIST = [
  {
    id: "1",
    title: "Krishna Highway Mix",
    artist: "Krishna Music",
    src: "assets/music/song1.mp3",
    cover: "",
    active: true
  },
  {
    id: "2",
    title: "Night Drive Vibes",
    artist: "Krishna Music",
    src: "assets/music/song2.mp3",
    cover: "",
    active: true
  },
  {
    id: "3",
    title: "Desi Road Mood",
    artist: "Krishna Music",
    src: "assets/music/song3.mp3",
    cover: "",
    active: true
  }
];

const PLAYLIST_STORAGE_KEY = "krishnaMusicPlaylistV1";

function getSavedPlaylist() {
  try {
    const saved = JSON.parse(localStorage.getItem(PLAYLIST_STORAGE_KEY) || "null");
    if (Array.isArray(saved)) {
      return saved.filter(track => track.active !== false);
    }
  } catch (error) {
    console.warn("Playlist read error:", error);
  }
  return DEFAULT_PLAYLIST.filter(track => track.active !== false);
}

let playlist = getSavedPlaylist();

const quotes = [
  "रास्ते बदलते हैं, यादें नहीं।",
  "सफ़र लंबा हो, संगीत साथ हो।",
  "दिल सड़क पर हो तो मंज़िल खुद मिल जाती है।",
  "रात, हाईवे और एक पसंदीदा धुन।",
  "चलते रहो — कहानी रास्ते में बनती है।"
];

const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const soundToggle = document.getElementById("soundToggle");
const soundIcon = document.getElementById("soundIcon");
const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const titleEl = document.getElementById("trackTitle");
const artistEl = document.getElementById("trackArtist");
const playlistPanel = document.getElementById("playlistPanel");
const playlistBtn = document.getElementById("playlistBtn");
const closePlaylist = document.getElementById("closePlaylist");
const playlistList = document.getElementById("playlistList");
const quoteEl = document.getElementById("quote");
const clock = document.getElementById("clock");
const hornBtn = document.getElementById("hornBtn");

let currentIndex = 0;
let shuffle = false;

function loadTrack(index, autoplay = false) {
  if (!playlist.length) {
    audio.removeAttribute("src");
    titleEl.textContent = "No song published";
    artistEl.textContent = "Admin Panel से song add करें";
    playlistList.innerHTML = "";
    return;
  }

  currentIndex = (index + playlist.length) % playlist.length;
  const track = playlist[currentIndex];
  audio.src = track.src;
  titleEl.textContent = track.title;
  artistEl.textContent = track.artist || "Krishna Music";
  renderPlaylist();

  if (autoplay) {
    audio.play().catch(() => {
      alert("Song play नहीं हो रहा। Audio Path / URL check करें।");
    });
  }
}

function togglePlay() {
  if (!playlist.length) {
    alert("Playlist में कोई published song नहीं है।");
    return;
  }

  if (!audio.src) loadTrack(currentIndex);

  if (audio.paused) {
    audio.play().catch(() => {
      alert("MP3 file नहीं मिला। Admin Panel में Audio URL / Path check करें।");
    });
  } else {
    audio.pause();
  }
}

function nextTrack() {
  if (!playlist.length) return;
  if (shuffle) loadTrack(Math.floor(Math.random() * playlist.length), true);
  else loadTrack(currentIndex + 1, true);
}

function prevTrack() {
  if (!playlist.length) return;
  loadTrack(currentIndex - 1, true);
}

function fmt(sec) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function renderPlaylist() {
  playlistList.innerHTML = "";
  playlist.forEach((track, index) => {
    const btn = document.createElement("button");
    btn.className = "song-item" + (index === currentIndex ? " active" : "");
    btn.innerHTML = `<div><strong>${track.title}</strong><br><span>${track.artist}</span></div><span>${index === currentIndex ? "●" : "▶"}</span>`;
    btn.addEventListener("click", () => loadTrack(index, true));
    playlistList.appendChild(btn);
  });
}

playBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", nextTrack);
prevBtn.addEventListener("click", prevTrack);

shuffleBtn.addEventListener("click", () => {
  shuffle = !shuffle;
  shuffleBtn.style.opacity = shuffle ? "1" : ".55";
});

soundToggle.addEventListener("click", () => {
  audio.muted = !audio.muted;
  soundIcon.textContent = audio.muted ? "🔇" : "♫";
});

audio.addEventListener("play", () => playBtn.textContent = "❚❚");
audio.addEventListener("pause", () => playBtn.textContent = "▶");
audio.addEventListener("ended", nextTrack);

audio.addEventListener("loadedmetadata", () => durationEl.textContent = fmt(audio.duration));
audio.addEventListener("timeupdate", () => {
  currentTimeEl.textContent = fmt(audio.currentTime);
  progress.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
});

progress.addEventListener("input", () => {
  if (audio.duration) audio.currentTime = (progress.value / 100) * audio.duration;
});

playlistBtn.addEventListener("click", () => {
  playlistPanel.classList.add("open");
  playlistPanel.setAttribute("aria-hidden","false");
});
closePlaylist.addEventListener("click", () => {
  playlistPanel.classList.remove("open");
  playlistPanel.setAttribute("aria-hidden","true");
});

hornBtn.addEventListener("click", () => {
  // छोटा WebAudio horn effect — किसी audio file की जरूरत नहीं।
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(190, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + .22);
  gain.gain.setValueAtTime(.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.18, ctx.currentTime + .025);
  gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .28);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + .3);
});

function updateClock(){
  const now = new Date();
  clock.textContent = now.toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit"}).toLowerCase();
}
updateClock();
setInterval(updateClock,1000);

let q = 0;
setInterval(() => {
  q = (q + 1) % quotes.length;
  quoteEl.animate([{opacity:0,transform:"translateY(5px)"},{opacity:1,transform:"none"}],{duration:500});
  quoteEl.textContent = quotes[q];
}, 6000);

// Admin Panel में playlist बदलने के बाद main website reload करने पर
// LocalStorage की latest playlist load होगी. अलग tab में change होने पर
// यह listener website को automatically refresh भी करता है.
window.addEventListener("storage", (event) => {
  if (event.key === PLAYLIST_STORAGE_KEY) {
    playlist = getSavedPlaylist();
    currentIndex = 0;
    loadTrack(0);
    renderPlaylist();
  }
});

playlist = getSavedPlaylist();
loadTrack(0);
renderPlaylist();
