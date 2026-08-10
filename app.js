const APPWRITE={endpoint:"https://fra.cloud.appwrite.io/v1",projectId:"6a7a168b00114627c0fd",databaseId:"6a7a179a0013f440763a",tableId:"songs",bucketId:"6a7a1b8c0038d2132ba5"};
const DEFAULT_PLAYLIST=[];
function fileUrl(id){return id?`${APPWRITE.endpoint}/storage/buckets/${APPWRITE.bucketId}/files/${encodeURIComponent(id)}/view?project=${encodeURIComponent(APPWRITE.projectId)}`:""}
async function getSavedPlaylist(){try{const url=`${APPWRITE.endpoint}/tablesdb/${APPWRITE.databaseId}/tables/${APPWRITE.tableId}/rows?queries[]=${encodeURIComponent(JSON.stringify({method:"equal",attribute:"published",values:[true]}))}&queries[]=${encodeURIComponent(JSON.stringify({method:"orderAsc",attribute:"sortOrder"}))}`;const r=await fetch(url,{headers:{"X-Appwrite-Project":APPWRITE.projectId}});if(!r.ok)throw new Error("Songs load failed");const d=await r.json();return(d.rows||[]).map(x=>({id:x.$id,title:x.title,artist:x.artist||"Krishna Music",src:fileUrl(x.audioFileId),cover:fileUrl(x.coverFileId),active:x.published!==false}))}catch(e){console.warn(e);return DEFAULT_PLAYLIST}}
let playlist=[];
const quotes=["रास्ते बदलते हैं, यादें नहीं।","सफ़र लंबा हो, संगीत साथ हो।","दिल सड़क पर हो तो मंज़िल खुद मिल जाती है।","रात, हाईवे और एक पसंदीदा धुन।","चलते रहो — कहानी रास्ते में बनती है।"];
const audio=document.getElementById("audio"),playBtn=document.getElementById("playBtn"),prevBtn=document.getElementById("prevBtn"),nextBtn=document.getElementById("nextBtn"),shuffleBtn=document.getElementById("shuffleBtn"),soundToggle=document.getElementById("soundToggle"),soundIcon=document.getElementById("soundIcon"),progress=document.getElementById("progress"),currentTimeEl=document.getElementById("currentTime"),durationEl=document.getElementById("duration"),titleEl=document.getElementById("trackTitle"),artistEl=document.getElementById("trackArtist"),playlistPanel=document.getElementById("playlistPanel"),playlistBtn=document.getElementById("playlistBtn"),closePlaylist=document.getElementById("closePlaylist"),playlistList=document.getElementById("playlistList"),quoteEl=document.getElementById("quote"),clock=document.getElementById("clock"),hornBtn=document.getElementById("hornBtn");let currentIndex=0,shuffle=false;
function loadTrack(index,autoplay=false){if(!playlist.length){audio.removeAttribute("src");titleEl.textContent="No song published";artistEl.textContent="Admin Panel से song add करें";playlistList.innerHTML="";return}currentIndex=(index+playlist.length)%playlist.length;const track=playlist[currentIndex];audio.src=track.src;titleEl.textContent=track.title;artistEl.textContent=track.artist||"Krishna Music";const cover=document.querySelector(".cover");if(cover)cover.style.backgroundImage=track.cover?`url("${track.cover}")`:"";renderPlaylist();if(autoplay)audio.play().catch(()=>alert("Song play नहीं हो रहा।"))}
function togglePlay(){if(!playlist.length){alert("Playlist में कोई published song नहीं है।");return}if(!audio.src)loadTrack(currentIndex);audio.paused?audio.play().catch(()=>alert("Audio play नहीं हो रहा।")):audio.pause()}
function nextTrack(){if(!playlist.length)return;shuffle?loadTrack(Math.floor(Math.random()*playlist.length),true):loadTrack(currentIndex+1,true)}function prevTrack(){if(playlist.length)loadTrack(currentIndex-1,true)}function fmt(sec){if(!Number.isFinite(sec))return"0:00";return`${Math.floor(sec/60)}:${Math.floor(sec%60).toString().padStart(2,"0")}`}
function renderPlaylist(){playlistList.innerHTML="";playlist.forEach((track,index)=>{const btn=document.createElement("button");btn.className="song-item"+(index===currentIndex?" active":"");btn.innerHTML=`<div><strong>${track.title}</strong><br><span>${track.artist}</span></div><span>${index===currentIndex?"●":"▶"}</span>`;btn.onclick=()=>loadTrack(index,true);playlistList.appendChild(btn)})}
playBtn.onclick=togglePlay;nextBtn.onclick=nextTrack;prevBtn.onclick=prevTrack;shuffleBtn.onclick=()=>{shuffle=!shuffle;shuffleBtn.style.opacity=shuffle?"1":".55"};soundToggle.onclick=()=>{audio.muted=!audio.muted;soundIcon.textContent=audio.muted?"🔇":"♫"};audio.onplay=()=>playBtn.textContent="❚❚";audio.onpause=()=>playBtn.textContent="▶";audio.onended=nextTrack;audio.onloadedmetadata=()=>durationEl.textContent=fmt(audio.duration);audio.ontimeupdate=()=>{currentTimeEl.textContent=fmt(audio.currentTime);progress.value=audio.duration?(audio.currentTime/audio.duration)*100:0};progress.oninput=()=>{if(audio.duration)audio.currentTime=(progress.value/100)*audio.duration};playlistBtn.onclick=()=>{playlistPanel.classList.add("open");playlistPanel.setAttribute("aria-hidden","false")};closePlaylist.onclick=()=>{playlistPanel.classList.remove("open");playlistPanel.setAttribute("aria-hidden","true")};
hornBtn.onclick = async () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "square";
    osc2.type = "sawtooth";

    osc1.frequency.setValueAtTime(180, ctx.currentTime);
    osc2.frequency.setValueAtTime(145, ctx.currentTime);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.22,
      ctx.currentTime + 0.03
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + 0.55
    );

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(ctx.currentTime + 0.55);
    osc2.stop(ctx.currentTime + 0.55);

    setTimeout(() => ctx.close(), 700);

  } catch (err) {
    console.error("Horn error:", err);
  }
};
  
function updateClock(){clock.textContent=new Date().toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit"}).toLowerCase()}updateClock();setInterval(updateClock,1000);let q=0;setInterval(()=>{q=(q+1)%quotes.length;quoteEl.animate([{opacity:0,transform:"translateY(5px)"},{opacity:1,transform:"none"}],{duration:500});quoteEl.textContent=quotes[q]},6000);
(async()=>{playlist=await getSavedPlaylist();loadTrack(0);renderPlaylist()})();
// ===== TOP PLAYLIST BUTTON =====
const topPlaylistBtn = document.getElementById("topPlaylistBtn");

if (topPlaylistBtn) {
  topPlaylistBtn.addEventListener("click", () => {
    playlistPanel.classList.add("open");
    playlistPanel.setAttribute("aria-hidden", "false");
  });
}
