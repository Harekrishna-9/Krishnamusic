const APPWRITE={endpoint:"https://fra.cloud.appwrite.io/v1",projectId:"6a7a168b00114627c0fd",databaseId:"6a7a179a0013f440763a",tableId:"songs",bucketId:"6a7a1b8c0038d2132ba5"};
const DEFAULT_PLAYLIST=[];
function fileUrl(id){return id?`${APPWRITE.endpoint}/storage/buckets/${APPWRITE.bucketId}/files/${encodeURIComponent(id)}/view?project=${encodeURIComponent(APPWRITE.projectId)}`:""}
async function getSavedPlaylist(){try{const url=`${APPWRITE.endpoint}/tablesdb/${APPWRITE.databaseId}/tables/${APPWRITE.tableId}/rows?queries[]=${encodeURIComponent(JSON.stringify({method:"equal",attribute:"published",values:[true]}))}&queries[]=${encodeURIComponent(JSON.stringify({method:"orderAsc",attribute:"sortOrder"}))}`;const r=await fetch(url,{headers:{"X-Appwrite-Project":APPWRITE.projectId}});if(!r.ok)throw new Error("Songs load failed");const d=await r.json();return(d.rows||[]).map(x=>({id:x.$id,title:x.title,artist:x.artist||"Krishna Music",src:fileUrl(x.audioFileId),cover:fileUrl(x.coverFileId),active:x.published!==false}))}catch(e){console.warn(e);return DEFAULT_PLAYLIST}}
let playlist=[];
const KM_CONFIG_KEY="kmControlCenterV2", KM_ANALYTICS_KEY="kmPlayAnalytics";
const KM_DEFAULT_CFG={featuredSongId:"",vibes:[],hornEnabled:true,hornVolume:22,defaultVolume:80,defaultShuffle:false,siteTitle:"Krishna Music",siteTagline:"सफ़र लंबा हो, संगीत साथ हो।",highwayStatus:"ON THE HIGHWAY",playlistTitle:"Playlist",autoplayPref:false,repeatPref:true,badgeText:"NOW PLAYING"};
function getKmCfg(){try{return{...KM_DEFAULT_CFG,...JSON.parse(localStorage.getItem(KM_CONFIG_KEY)||"{}")}}catch{return{...KM_DEFAULT_CFG}}}
async function getCloudKmCfg(){try{const u=`${APPWRITE.endpoint}/storage/buckets/${APPWRITE.bucketId}/files/km_control_center_v2/view?project=${encodeURIComponent(APPWRITE.projectId)}&ts=${Date.now()}`,r=await fetch(u,{cache:"no-store"});if(!r.ok)throw new Error("no cloud config");const d=await r.json();localStorage.setItem(KM_CONFIG_KEY,JSON.stringify(d));return{...KM_DEFAULT_CFG,...d}}catch{return getKmCfg()}}
let kmCfg=getKmCfg();
let quotes=["रास्ते बदलते हैं, यादें नहीं।","सफ़र लंबा हो, संगीत साथ हो।","दिल सड़क पर हो तो मंज़िल खुद मिल जाती है।","रात, हाईवे और एक पसंदीदा धुन।","चलते रहो — कहानी रास्ते में बनती है।"];
const audio=document.getElementById("audio"),playBtn=document.getElementById("playBtn"),prevBtn=document.getElementById("prevBtn"),nextBtn=document.getElementById("nextBtn"),shuffleBtn=document.getElementById("shuffleBtn"),soundToggle=document.getElementById("soundToggle"),soundIcon=document.getElementById("soundIcon"),progress=document.getElementById("progress"),currentTimeEl=document.getElementById("currentTime"),durationEl=document.getElementById("duration"),titleEl=document.getElementById("trackTitle"),artistEl=document.getElementById("trackArtist"),playlistPanel=document.getElementById("playlistPanel"),playlistBtn=document.getElementById("playlistBtn"),closePlaylist=document.getElementById("closePlaylist"),playlistList=document.getElementById("playlistList"),quoteEl=document.getElementById("quote"),clock=document.getElementById("clock"),hornBtn=document.getElementById("hornBtn");let currentIndex=0,shuffle=false;
function loadTrack(index,autoplay=false){if(!playlist.length){audio.removeAttribute("src");titleEl.textContent="No song published";artistEl.textContent="Admin Panel से song add करें";playlistList.innerHTML="";return}currentIndex=(index+playlist.length)%playlist.length;const track=playlist[currentIndex];audio.src=track.src;titleEl.textContent=track.title;artistEl.textContent=track.artist||"Krishna Music";const cover=document.querySelector(".cover");if(cover)cover.style.backgroundImage=track.cover?`url("${track.cover}")`:"";renderPlaylist();if(autoplay)audio.play().catch(()=>alert("Song play नहीं हो रहा।"))}
function togglePlay(){if(!playlist.length){alert("Playlist में कोई published song नहीं है।");return}if(!audio.src)loadTrack(currentIndex);audio.paused?audio.play().catch(()=>alert("Audio play नहीं हो रहा।")):audio.pause()}
function nextTrack(){if(!playlist.length)return;shuffle?loadTrack(Math.floor(Math.random()*playlist.length),true):loadTrack(currentIndex+1,true)}function prevTrack(){if(playlist.length)loadTrack(currentIndex-1,true)}function fmt(sec){if(!Number.isFinite(sec))return"0:00";return`${Math.floor(sec/60)}:${Math.floor(sec%60).toString().padStart(2,"0")}`}
let playlistFilter="all";
let recentTrackIds=[];
let favoriteTrackIds=JSON.parse(localStorage.getItem("kmFavoriteTrackIds")||"[]");
function renderPlaylist(){
  playlistList.innerHTML="";
  let entries=playlist.map((track,index)=>({track,index}));
  if(playlistFilter==="recent") entries=entries.filter(({track})=>recentTrackIds.includes(track.id));
  if(playlistFilter==="favorites") entries=entries.filter(({track})=>favoriteTrackIds.includes(track.id));
  if(!entries.length){
    playlistList.innerHTML=`<div style="padding:26px 12px;text-align:center;color:rgba(255,255,255,.48);font-size:11px">No songs in this view</div>`;
  } else {
    entries.forEach(({track,index})=>{
      const btn=document.createElement("button");
      btn.className="song-item"+(index===currentIndex?" active":"");
      btn.innerHTML=`<div class="song-title-cell"><strong>${track.title}</strong></div><div class="song-artist-cell"><span>${track.artist||"Krishna Music"}</span></div><span class="song-play-cell">${index===currentIndex?"●":"▶"}</span>`;
      btn.onclick=()=>{
        recentTrackIds=[track.id,...recentTrackIds.filter(id=>id!==track.id)].slice(0,20);
        loadTrack(index,true);
      };
      playlistList.appendChild(btn);
    });
  }
  const countEl=document.getElementById("playlistCount");
  if(countEl) countEl.textContent=`${entries.length} song${entries.length===1?"":"s"}`;
}
playBtn.onclick=togglePlay;nextBtn.onclick=nextTrack;prevBtn.onclick=prevTrack;shuffleBtn.onclick=()=>{shuffle=!shuffle;shuffleBtn.style.opacity=shuffle?"1":".55"};soundToggle.onclick=()=>{audio.muted=!audio.muted;soundIcon.textContent=audio.muted?"🔇":"♫"};audio.onplay=()=>playBtn.textContent="❚❚";audio.onpause=()=>playBtn.textContent="▶";audio.onended=nextTrack;audio.onloadedmetadata=()=>durationEl.textContent=fmt(audio.duration);audio.ontimeupdate=()=>{currentTimeEl.textContent=fmt(audio.currentTime);progress.value=audio.duration?(audio.currentTime/audio.duration)*100:0};progress.oninput=()=>{if(audio.duration)audio.currentTime=(progress.value/100)*audio.duration};playlistBtn.onclick=()=>{playlistPanel.classList.add("open");playlistPanel.setAttribute("aria-hidden","false")};closePlaylist.onclick=()=>{playlistPanel.classList.remove("open");playlistPanel.setAttribute("aria-hidden","true")};
const playlistTabs=document.querySelectorAll(".playlist-tab");
playlistTabs.forEach(tab=>tab.addEventListener("click",()=>{
  playlistTabs.forEach(t=>t.classList.remove("active"));
  tab.classList.add("active");
  playlistFilter=tab.dataset.filter||"all";
  renderPlaylist();
}));

hornBtn.onclick = async () => {
  if(!kmCfg.hornEnabled) return;
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
      Math.max(0.001,(Number(kmCfg.hornVolume)||22)/100),
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
function applyKmSettings(){
  kmCfg=getKmCfg();
  if(Array.isArray(kmCfg.vibes)&&kmCfg.vibes.length){quotes=kmCfg.vibes.filter(Boolean);if(quotes.length)quoteEl.textContent=quotes[0]}
  document.title=(kmCfg.siteTitle||"Krishna Music")+" — Highway Vibes";
  const tagline=document.querySelector(".tagline");if(tagline)tagline.textContent=kmCfg.siteTagline||"सफ़र लंबा हो, संगीत साथ हो।";
  const hs=document.querySelector(".highway-status");if(hs){const line=hs.querySelector(".highway-line");hs.textContent="";if(line)hs.appendChild(line);hs.append(document.createTextNode(" "+(kmCfg.highwayStatus||"ON THE HIGHWAY")))}
  const ph=document.querySelector(".playlist-head h3");if(ph)ph.textContent=kmCfg.playlistTitle||"Playlist";
  const badge=document.querySelector(".track-badge");if(badge)badge.textContent=kmCfg.badgeText||"NOW PLAYING";
  audio.volume=Math.max(0,Math.min(1,(Number(kmCfg.defaultVolume)||80)/100));
  shuffle=!!kmCfg.defaultShuffle;if(shuffleBtn)shuffleBtn.style.opacity=shuffle?"1":".55";
}
function countKmPlay(id){try{const a=JSON.parse(localStorage.getItem(KM_ANALYTICS_KEY)||"{}");a[id]=(Number(a[id])||0)+1;localStorage.setItem(KM_ANALYTICS_KEY,JSON.stringify(a))}catch{}}
let lastCountedTrack="";
audio.addEventListener("play",()=>{const t=playlist[currentIndex];if(t&&lastCountedTrack!==t.id){countKmPlay(t.id);lastCountedTrack=t.id}});
audio.addEventListener("ended",()=>{lastCountedTrack=""});
(async()=>{playlist=await getSavedPlaylist();kmCfg=await getCloudKmCfg();applyKmSettings();if(kmCfg.featuredSongId){const i=playlist.findIndex(x=>x.id===kmCfg.featuredSongId);if(i>0)playlist=[playlist[i],...playlist.slice(0,i),...playlist.slice(i+1)]}loadTrack(0);renderPlaylist();if(kmCfg.autoplayPref)audio.play().catch(()=>{})})();
window.addEventListener("storage",e=>{if(e.key===KM_CONFIG_KEY)applyKmSettings()});
// ===== TOP PLAYLIST BUTTON =====
const topPlaylistBtn = document.getElementById("topPlaylistBtn");

if (topPlaylistBtn) {
  topPlaylistBtn.addEventListener("click", () => {
    playlistPanel.classList.add("open");
    playlistPanel.setAttribute("aria-hidden", "false");
  });
}
// ===== REAL LIVE LISTENERS COUNT =====

const LISTENERS_TABLE_ID = "listeners";
const liveListenerCountEl = document.getElementById("liveListenerCount");

const listenerSessionId =
  localStorage.getItem("krishnaListenerSession") ||
  ("listener_" + crypto.randomUUID().replaceAll("-", ""));

localStorage.setItem("krishnaListenerSession", listenerSessionId);

function listenersApi(rowId = "") {
  return `${APPWRITE.endpoint}/databases/${APPWRITE.databaseId}/tables/${LISTENERS_TABLE_ID}/rows${rowId ? "/" + rowId : ""}`;
}

async function updateMyPresence() {
  const now = new Date().toISOString();

  try {
    const check = await fetch(listenersApi(listenerSessionId), {
      headers: {
        "X-Appwrite-Project": APPWRITE.projectId
      }
    });

    if (check.ok) {
      await fetch(listenersApi(listenerSessionId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": APPWRITE.projectId
        },
        body: JSON.stringify({
          data: {
            sessionId: listenerSessionId,
            lastSeen: now
          }
        })
      });
    } else {
      await fetch(listenersApi(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": APPWRITE.projectId
        },
        body: JSON.stringify({
          rowId: listenerSessionId,
          data: {
            sessionId: listenerSessionId,
            lastSeen: now
          }
        })
      });
    }

  } catch (err) {
    console.warn("Presence update error:", err);
  }
}

async function refreshLiveListenerCount() {
  try {
    const res = await fetch(
      `${listenersApi()}?queries[]=${encodeURIComponent(
        JSON.stringify({
          method: "limit",
          values: [100]
        })
      )}`,
      {
        headers: {
          "X-Appwrite-Project": APPWRITE.projectId
        }
      }
    );

    if (!res.ok) return;

    const data = await res.json();

    const cutoff = Date.now() - 45000;

    const activeListeners = (data.rows || []).filter(row => {
      return new Date(row.lastSeen).getTime() >= cutoff;
    });

    if (liveListenerCountEl) {
      liveListenerCountEl.textContent = activeListeners.length;
    }

  } catch (err) {
    console.warn("Live count error:", err);
  }
}

async function runPresence() {
  await updateMyPresence();
  await refreshLiveListenerCount();
}

runPresence();

setInterval(async () => {
  await updateMyPresence();
  await refreshLiveListenerCount();
}, 15000);

setInterval(refreshLiveListenerCount, 5000);
