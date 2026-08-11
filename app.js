const YOUTUBE_PLAYLIST_ID = "PLYIo8vpxz3qI";
const quotes=["रास्ते बदलते हैं, यादें नहीं।","सफ़र लंबा हो, संगीत साथ हो।","दिल सड़क पर हो तो मंज़िल खुद मिल जाती है।","रात, हाईवे और एक पसंदीदा धुन।","चलते रहो — कहानी रास्ते में बनती है।"];

const playBtn=document.getElementById("playBtn"),prevBtn=document.getElementById("prevBtn"),nextBtn=document.getElementById("nextBtn"),shuffleBtn=document.getElementById("shuffleBtn"),soundToggle=document.getElementById("soundToggle"),soundIcon=document.getElementById("soundIcon"),progress=document.getElementById("progress"),currentTimeEl=document.getElementById("currentTime"),durationEl=document.getElementById("duration"),titleEl=document.getElementById("trackTitle"),artistEl=document.getElementById("trackArtist"),playlistPanel=document.getElementById("playlistPanel"),playlistBtn=document.getElementById("playlistBtn"),closePlaylist=document.getElementById("closePlaylist"),playlistList=document.getElementById("playlistList"),quoteEl=document.getElementById("quote"),clock=document.getElementById("clock"),hornBtn=document.getElementById("hornBtn");

let ytPlayer=null,ytReady=false,shuffle=false,progressTimer=null;
function fmt(sec){if(!Number.isFinite(sec))return"0:00";return`${Math.floor(sec/60)}:${Math.floor(sec%60).toString().padStart(2,"0")}`}
function openPlaylist(){playlistPanel.classList.add("open");playlistPanel.setAttribute("aria-hidden","false")}
function closePlaylistPanel(){playlistPanel.classList.remove("open");playlistPanel.setAttribute("aria-hidden","true")}

window.onYouTubeIframeAPIReady=function(){
  ytPlayer=new YT.Player("youtubePlayer",{
    width:"100%",height:"100%",
    playerVars:{listType:"playlist",list:YOUTUBE_PLAYLIST_ID,autoplay:0,controls:1,playsinline:1,rel:0},
    events:{
      onReady:()=>{ytReady=true;ytPlayer.cuePlaylist({listType:"playlist",list:YOUTUBE_PLAYLIST_ID,index:0,startSeconds:0});updateYouTubeInfo();renderYouTubePlaylist();startProgressSync()},
      onStateChange:(e)=>{playBtn.textContent=e.data===YT.PlayerState.PLAYING?"❚❚":"▶";if(e.data===YT.PlayerState.PLAYING||e.data===YT.PlayerState.CUED||e.data===YT.PlayerState.PAUSED){setTimeout(()=>{updateYouTubeInfo();renderYouTubePlaylist()},150)}}
    }
  })
};

function updateYouTubeInfo(){
  if(!ytReady)return;
  const data=ytPlayer.getVideoData?.()||{};
  if(data.title)titleEl.textContent=data.title;
  artistEl.textContent=data.author||"YouTube Music";
  const d=ytPlayer.getDuration?.()||0;durationEl.textContent=fmt(d);
}
function startProgressSync(){clearInterval(progressTimer);progressTimer=setInterval(()=>{if(!ytReady)return;const t=ytPlayer.getCurrentTime?.()||0,d=ytPlayer.getDuration?.()||0;currentTimeEl.textContent=fmt(t);durationEl.textContent=fmt(d);progress.value=d?(t/d)*100:0},500)}
function togglePlay(){if(!ytReady)return;const st=ytPlayer.getPlayerState();st===YT.PlayerState.PLAYING?ytPlayer.pauseVideo():ytPlayer.playVideo()}
function nextTrack(){if(!ytReady)return;if(shuffle){const ids=ytPlayer.getPlaylist()||[];if(ids.length)ytPlayer.playVideoAt(Math.floor(Math.random()*ids.length));}else ytPlayer.nextVideo()}
function prevTrack(){if(ytReady)ytPlayer.previousVideo()}
function renderYouTubePlaylist(){
  if(!ytReady)return;const ids=ytPlayer.getPlaylist?.()||[],cur=ytPlayer.getPlaylistIndex?.()??0;
  playlistList.innerHTML="";
  ids.forEach((id,i)=>{const b=document.createElement("button");b.className="song-item"+(i===cur?" active":"");b.innerHTML=`<div><strong>${i===cur?(ytPlayer.getVideoData()?.title||`Track ${i+1}`):`Track ${i+1}`}</strong><br><span>${i===cur?"Now playing":"YouTube Music"}</span></div><span>${i===cur?"●":"▶"}</span>`;b.onclick=()=>{ytPlayer.playVideoAt(i);setTimeout(()=>{updateYouTubeInfo();renderYouTubePlaylist()},250)};playlistList.appendChild(b)});
}

playBtn.onclick=togglePlay;nextBtn.onclick=nextTrack;prevBtn.onclick=prevTrack;
shuffleBtn.onclick=()=>{shuffle=!shuffle;shuffleBtn.style.opacity=shuffle?"1":".55"};
soundToggle.onclick=()=>{if(!ytReady)return;if(ytPlayer.isMuted()){ytPlayer.unMute();soundIcon.textContent="♫"}else{ytPlayer.mute();soundIcon.textContent="🔇"}};
progress.oninput=()=>{if(!ytReady)return;const d=ytPlayer.getDuration?.()||0;if(d)ytPlayer.seekTo((progress.value/100)*d,true)};
playlistBtn.onclick=openPlaylist;closePlaylist.onclick=closePlaylistPanel;
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
