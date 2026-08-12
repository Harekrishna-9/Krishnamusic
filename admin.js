const APPWRITE={endpoint:"https://fra.cloud.appwrite.io/v1",projectId:"6a7a168b00114627c0fd",databaseId:"6a7a179a0013f440763a",tableId:"songs",bucketId:"6a7a1b8c0038d2132ba5"};
const $=id=>document.getElementById(id);let songs=[],q="",activePreviewId="",previewObjectUrl="";
const headers=(json=false)=>({"X-Appwrite-Project":APPWRITE.projectId,...(json?{"Content-Type":"application/json"}:{})});
async function req(path,opt={}){let r;try{r=await fetch(APPWRITE.endpoint+path,{credentials:"include",...opt,headers:{...headers(false),...(opt.headers||{})}})}catch(e){throw new Error("Appwrite connect नहीं हो पाया। Project ID / Web hostname check करें।")}const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||`Request failed (${r.status})`);return d}
function fileUrl(id){return id?`${APPWRITE.endpoint}/storage/buckets/${APPWRITE.bucketId}/files/${encodeURIComponent(id)}/view?project=${encodeURIComponent(APPWRITE.projectId)}`:""}
function mapRow(r){return{id:r.$id,title:r.title||"Untitled",artist:r.artist||"Krishna Music",audioFileId:r.audioFileId||"",coverFileId:r.coverFileId||"",src:fileUrl(r.audioFileId),cover:fileUrl(r.coverFileId),active:r.published!==false,sortOrder:Number(r.sortOrder||0),createdAt:r.$createdAt||""}}
async function read(){const d=await req(`/tablesdb/${APPWRITE.databaseId}/tables/${APPWRITE.tableId}/rows?queries[]=${encodeURIComponent(JSON.stringify({method:"orderAsc",attribute:"sortOrder"}))}`);return(d.rows||[]).map(mapRow)}
async function refresh(){try{songs=await read();render();renderDashboard();renderPlaylists();renderAnalytics()}catch(e){console.error(e);toast(e.message)}}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1900)}
async function showApp(){$("login").classList.add("hidden");$("app").classList.remove("hidden");await loadCloudControlCenter();refresh();loadControlCenter();refreshListeners();loadStorageUsage()}
async function session(){try{await req("/account");showApp()}catch{}}
session();
$("loginForm").onsubmit=async e=>{e.preventDefault();try{await req("/account/sessions/email",{method:"POST",headers:headers(true),body:JSON.stringify({email:$("email").value.trim(),password:$("password").value})});showApp()}catch(err){alert(err.message)}};
$("logout").onclick=async()=>{try{await req("/account/sessions/current",{method:"DELETE"})}catch{}location.reload()};

/* ---------- Navigation ---------- */
const viewMeta={dashboard:["Control Center","Your highway music command center."],library:["Music Library","Preview, organize and publish every track."],playlists:["Playlist Studio","Build multiple moods and highway collections."],listeners:["Live Listeners","See active listener sessions in real time."],analytics:["Analytics","Track playback activity and library performance."],vibes:["Vibe Messages","Control the rotating highway quotes."],sounds:["Sound Effects","Tune horn and playback defaults."],settings:["Website Settings","Manage public-facing labels and player preferences."],backup:["Backup & Activity","Export settings and review admin actions."]};
function switchView(name){document.querySelectorAll(".admin-view").forEach(v=>v.classList.toggle("active",v.dataset.panel===name));document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===name));const m=viewMeta[name]||viewMeta.dashboard;$("viewTitle").textContent=m[0];$("viewSubtitle").textContent=m[1];if(name==="listeners")refreshListeners();if(name==="backup")renderActivity()}
document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>switchView(b.dataset.view));

/* ---------- Song library ---------- */
function filteredSongs(){let list=songs.filter(s=>(s.title+" "+s.artist).toLowerCase().includes(q.toLowerCase()));const st=$("statusFilter")?.value||"all";if(st==="published")list=list.filter(s=>s.active);if(st==="hidden")list=list.filter(s=>!s.active);const sort=$("sortFilter")?.value||"order";if(sort==="az")list=[...list].sort((a,b)=>a.title.localeCompare(b.title));if(sort==="za")list=[...list].sort((a,b)=>b.title.localeCompare(a.title));return list}
function render(){ $("total").textContent=songs.length;$("published").textContent=songs.filter(s=>s.active).length;$("hiddenCount").textContent=songs.filter(s=>!s.active).length;const list=filteredSongs();$("rows").innerHTML="";$("empty").classList.toggle("hidden",list.length>0);list.forEach(s=>{const i=songs.findIndex(x=>x.id===s.id),tr=document.createElement("tr");tr.innerHTML=`<td><input class="row-select" type="checkbox" data-id="${s.id}"></td><td>${i+1}</td><td><div class="song-cell"><div class="row-cover" ${s.cover?`style="background-image:url('${esc(s.cover)}')"`:""}>${s.cover?"":"KM"}</div><div class="song"><strong>${esc(s.title)}</strong><small>${esc(s.artist)}</small></div></div></td><td><button class="mini preview-btn" data-id="${s.id}" title="Preview">▶</button></td><td><button class="mini toggle" data-id="${s.id}"><span class="badge ${s.active?"on":"off"}">${s.active?"Published":"Hidden"}</span></button></td><td><button class="mini up" data-id="${s.id}">↑</button> <button class="mini down" data-id="${s.id}">↓</button></td><td><button class="mini edit" data-id="${s.id}">Edit</button> <button class="mini danger del" data-id="${s.id}">Delete</button></td>`;$("rows").appendChild(tr)});document.querySelectorAll(".edit").forEach(b=>b.onclick=()=>edit(b.dataset.id));document.querySelectorAll(".del").forEach(b=>b.onclick=()=>del(b.dataset.id));document.querySelectorAll(".toggle").forEach(b=>b.onclick=()=>toggle(b.dataset.id));document.querySelectorAll(".up").forEach(b=>b.onclick=()=>move(b.dataset.id,-1));document.querySelectorAll(".down").forEach(b=>b.onclick=()=>move(b.dataset.id,1));document.querySelectorAll(".preview-btn").forEach(b=>b.onclick=()=>previewSong(b.dataset.id,b))}
$("search").oninput=e=>{q=e.target.value;render()};$("statusFilter").onchange=render;$("sortFilter").onchange=render;
$("selectAll").onchange=e=>document.querySelectorAll(".row-select").forEach(c=>c.checked=e.target.checked);
function selectedIds(){return[...document.querySelectorAll(".row-select:checked")].map(x=>x.dataset.id)}
async function bulkSet(published){const ids=selectedIds();if(!ids.length)return toast("Select songs first");try{await Promise.all(ids.map(id=>patch(id,{published})));logActivity(`${ids.length} songs ${published?"published":"hidden"}`);await refresh();toast("Bulk action complete")}catch(e){alert(e.message)}}
$("bulkPublish").onclick=()=>bulkSet(true);$("bulkHide").onclick=()=>bulkSet(false);
function previewSong(id,btn){const s=songs.find(x=>x.id===id),a=$("adminPreviewAudio");if(!s?.src)return toast("Audio unavailable");if(activePreviewId===id&&!a.paused){a.pause();btn.textContent="▶";btn.classList.remove("playing");return}document.querySelectorAll(".preview-btn").forEach(x=>{x.textContent="▶";x.classList.remove("playing")});activePreviewId=id;a.src=s.src;a.play().then(()=>{btn.textContent="❚❚";btn.classList.add("playing")}).catch(()=>toast("Preview play नहीं हुआ"));a.onended=()=>{btn.textContent="▶";btn.classList.remove("playing");activePreviewId=""}}


/* ---------- Manual song → folder assignment ---------- */
function songFolderIds(songId){
  const c=getCfg();
  return (c.playlists||[]).filter(p=>(p.songIds||[]).includes(songId)).map(p=>p.id);
}
function renderSongFolderPicker(songId=""){
  const box=$("songFolderPicker");
  if(!box)return;
  const c=getCfg(),pls=Array.isArray(c.playlists)?c.playlists:[];
  const selected=new Set(songId?songFolderIds(songId):[]);
  box.innerHTML=pls.length?pls.map(p=>`<label class="check-item"><input type="checkbox" data-song-folder="${p.id}" ${selected.has(p.id)?"checked":""}><span>${esc(p.name)} <small>• ${p.published===true?"Published":"Not published"}</small></span></label>`).join(""):`<div class="empty-state">Create a playlist folder first.</div>`;
}
function selectedSongFolderIds(){
  return [...document.querySelectorAll("[data-song-folder]:checked")].map(x=>x.dataset.songFolder);
}
function saveSongFolderAssignments(songId,folderIds){
  if(!songId)return;
  const wanted=new Set(folderIds||[]);
  const c=getCfg();
  c.playlists=(c.playlists||[]).map(p=>{
    const ids=new Set(p.songIds||[]);
    if(wanted.has(p.id))ids.add(songId);else ids.delete(songId);
    return {...p,songIds:[...ids]};
  });
  saveCfg(c);
}

/* ---------- Add / Edit modal ---------- */
function open(){document.body.style.overflow="hidden";$("modal").classList.remove("hidden")}
function close(){document.body.style.overflow="";$("modal").classList.add("hidden");$("songForm").reset();$("active").checked=true;$("editId").value="";$("audioName").textContent="MP3, WAV, M4A";$("coverName").textContent="JPG, PNG, WEBP";$("saveBtn").classList.remove("loading");$("saveBtn").disabled=false;document.querySelector(".save-text").textContent="Save Music";$("mediaPreview").classList.add("hidden");$("adminPreviewAudio").pause();if($("songFolderPicker"))$("songFolderPicker").innerHTML="";if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=""}}
$("add").onclick=()=>{close();$("modalTitle").textContent="Add Music";renderSongFolderPicker("");open()};$("close").onclick=close;$("cancel").onclick=close;$("modal").onclick=e=>{if(e.target===$("modal"))close()};document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("modal").classList.contains("hidden"))close()});
function updateModalPreview(){const title=$("songTitle").value.trim()||"Track preview",artist=$("artist").value.trim()||"Krishna Music";$("previewTitle").textContent=title;$("previewArtist").textContent=artist;$("mediaPreview").classList.remove("hidden")}
$("songTitle").oninput=updateModalPreview;$("artist").oninput=updateModalPreview;
$("audioFile").onchange=e=>{const f=e.target.files[0];$("audioName").textContent=f?.name||"MP3, WAV, M4A";updateModalPreview();if(f){if(previewObjectUrl)URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=URL.createObjectURL(f);$("adminPreviewAudio").src=previewObjectUrl}};
$("coverFile").onchange=e=>{const f=e.target.files[0];$("coverName").textContent=f?.name||"JPG, PNG, WEBP";updateModalPreview();if(f){const u=URL.createObjectURL(f);$("previewCover").style.backgroundImage=`url('${u}')`;$("previewCover").textContent="";setTimeout(()=>URL.revokeObjectURL(u),5000)}};
$("previewAudioBtn").onclick=()=>{const a=$("adminPreviewAudio");if(!a.src)return toast("Choose audio first");if(a.paused){a.play();$("previewAudioBtn").textContent="❚❚ Pause"}else{a.pause();$("previewAudioBtn").textContent="▶ Preview"}};
function edit(id){const s=songs.find(x=>x.id===id);$("modalTitle").textContent="Edit Music";$("editId").value=s.id;$("songTitle").value=s.title;$("artist").value=s.artist;$("active").checked=s.active;$("mediaPreview").classList.remove("hidden");$("previewTitle").textContent=s.title;$("previewArtist").textContent=s.artist;$("previewCover").style.backgroundImage=s.cover?`url('${s.cover}')`:"";$("previewCover").textContent=s.cover?"":"KM";$("adminPreviewAudio").src=s.src;renderSongFolderPicker(s.id);open()}
async function upload(file){
  if(!file)return"";

  const CHUNK_SIZE=5*1024*1024;
  const uploadUrl=`${APPWRITE.endpoint}/storage/buckets/${APPWRITE.bucketId}/files`;

  // Small files: normal upload
  if(file.size<=CHUNK_SIZE){
    const fd=new FormData();
    fd.append("fileId","unique()");
    fd.append("file",file,file.name);

    let r;
    try{
      r=await fetch(uploadUrl,{
        method:"POST",
        credentials:"include",
        headers:{"X-Appwrite-Project":APPWRITE.projectId},
        body:fd
      });
    }catch(err){
      console.error("Appwrite small-file upload network error:",err);
      throw new Error("Appwrite upload connect नहीं हो पाया। Internet/Storage permission check करें।");
    }

    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.message||`Upload failed (${r.status})`);
    return d.$id||d.id||"";
  }

  // Large files: Appwrite requires 5 MB chunked upload.
  let fileId="";
  let lastResponse=null;

  for(let start=0;start<file.size;start+=CHUNK_SIZE){
    const end=Math.min(start+CHUNK_SIZE,file.size);
    const chunk=file.slice(start,end,file.type||"application/octet-stream");

    const fd=new FormData();
    fd.append("fileId",fileId||"unique()");
    fd.append("file",chunk,file.name);

    const headers={
      "X-Appwrite-Project":APPWRITE.projectId,
      "Content-Range":`bytes ${start}-${end-1}/${file.size}`
    };

    if(fileId)headers["X-Appwrite-ID"]=fileId;

    let r;
    try{
      r=await fetch(uploadUrl,{
        method:"POST",
        credentials:"include",
        headers,
        body:fd
      });
    }catch(err){
      console.error(`Appwrite chunk upload network error (${start}-${end-1}):`,err);
      throw new Error("Large audio upload connect नहीं हो पाया। Retry करें।");
    }

    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.message||`Chunk upload failed (${r.status})`);

    lastResponse=d;
    fileId=fileId||d.$id||d.id||"";

    if(!fileId)throw new Error("Appwrite ने uploaded file ID return नहीं किया।");

    const pct=Math.round((end/file.size)*100);
    const txt=document.querySelector(".save-text");
    if(txt)txt.textContent=`Uploading ${pct}%`;
  }

  return fileId||(lastResponse?.$id||lastResponse?.id||"");
}
$("songForm").onsubmit=async e=>{e.preventDefault();const id=$("editId").value,old=songs.find(x=>x.id===id),btn=$("saveBtn"),txt=document.querySelector(".save-text"),folderIds=selectedSongFolderIds();try{btn.classList.add("loading");btn.disabled=true;txt.textContent=id?"Updating...":"Saving...";toast("Uploading music...");const audioFileId=await upload($("audioFile").files[0])||(old?.audioFileId||"");if(!audioFileId)throw new Error("Audio file select करें");const coverFileId=await upload($("coverFile").files[0])||(old?.coverFileId||"");const data={title:$("songTitle").value.trim(),artist:$("artist").value.trim()||"Krishna Music",audioFileId,coverFileId:coverFileId||null,published:$("active").checked,sortOrder:old?.sortOrder??songs.length};let savedSongId=id;if(id){await req(`/tablesdb/${APPWRITE.databaseId}/tables/${APPWRITE.tableId}/rows/${id}`,{method:"PATCH",headers:headers(true),body:JSON.stringify({data})})}else{const created=await req(`/tablesdb/${APPWRITE.databaseId}/tables/${APPWRITE.tableId}/rows`,{method:"POST",headers:headers(true),body:JSON.stringify({rowId:"unique()",data})});savedSongId=created.$id||created.id||""}if(savedSongId)saveSongFolderAssignments(savedSongId,folderIds);txt.textContent="Saved ✓";logActivity(`${id?"Updated":"Added"} music: ${data.title}${folderIds.length?` • ${folderIds.length} folder${folderIds.length===1?"":"s"}`:""}`);toast(id?"Music updated":"Music saved");await new Promise(r=>setTimeout(r,350));close();await refresh()}catch(err){btn.classList.remove("loading");btn.disabled=false;txt.textContent="Save Music";alert(err.message)}};
async function del(id){const s=songs.find(x=>x.id===id);if(!confirm(`Delete "${s?.title}"?`))return;try{await req(`/tablesdb/${APPWRITE.databaseId}/tables/${APPWRITE.tableId}/rows/${id}`,{method:"DELETE"});logActivity(`Deleted music: ${s?.title||id}`);await refresh();toast("Deleted")}catch(e){alert(e.message)}}
async function patch(id,data){return req(`/tablesdb/${APPWRITE.databaseId}/tables/${APPWRITE.tableId}/rows/${id}`,{method:"PATCH",headers:headers(true),body:JSON.stringify({data})})}
async function toggle(id){const s=songs.find(x=>x.id===id);try{await patch(id,{published:!s.active});logActivity(`${!s.active?"Published":"Hidden"}: ${s.title}`);await refresh()}catch(e){alert(e.message)}}
async function move(id,d){const i=songs.findIndex(x=>x.id===id),n=i+d;if(n<0||n>=songs.length)return;try{await Promise.all([patch(songs[i].id,{sortOrder:n}),patch(songs[n].id,{sortOrder:i})]);await refresh()}catch(e){alert(e.message)}}
$("export").onclick=()=>downloadJson("krishna-music-playlist.json",songs);$("import").onchange=()=>{alert("Online Appwrite version में songs Add Music से upload करें।");$("import").value=""};

/* ---------- Control Center persistent config ---------- */
const CONFIG_KEY="kmControlCenterV2",ANALYTICS_KEY="kmPlayAnalytics",ACTIVITY_KEY="kmAdminActivity";
const defaults={featuredSongId:"",playlists:[{id:"highway",name:"Highway Vibes",songIds:[],published:true}],vibes:["रास्ते बदलते हैं, यादें नहीं।","सफ़र लंबा हो, संगीत साथ हो।","दिल सड़क पर हो तो मंज़िल खुद मिल जाती है।","रात, हाईवे और एक पसंदीदा धुन।","चलते रहो — कहानी रास्ते में बनती है।"],hornEnabled:true,hornVolume:22,defaultVolume:80,defaultShuffle:false,siteTitle:"Krishna Music",siteTagline:"सफ़र लंबा हो, संगीत साथ हो।",highwayStatus:"ON THE HIGHWAY",playlistTitle:"Playlist",autoplayPref:false,repeatPref:true,badgeText:"NOW PLAYING"};
async function loadCloudControlCenter(){try{const u=`/storage/buckets/${APPWRITE.bucketId}/files/km_control_center_v2/view?project=${encodeURIComponent(APPWRITE.projectId)}&ts=${Date.now()}`;const d=await req(u);if(d&&typeof d==="object")localStorage.setItem("kmControlCenterV2",JSON.stringify({...defaults,...d}))}catch{}}

function getCfg(){try{return{...defaults,...JSON.parse(localStorage.getItem(CONFIG_KEY)||"{}")}}catch{return{...defaults}}}
const CLOUD_CONFIG_FILE_ID="km_control_center_v2";
let cloudSyncTimer;
async function syncCloudConfig(cfg){try{clearTimeout(cloudSyncTimer);cloudSyncTimer=setTimeout(async()=>{try{await req(`/storage/buckets/${APPWRITE.bucketId}/files/${CLOUD_CONFIG_FILE_ID}`,{method:"DELETE"})}catch{}try{const blob=new Blob([JSON.stringify({...cfg,updatedAt:new Date().toISOString()})],{type:"application/json"}),fd=new FormData();fd.append("fileId",CLOUD_CONFIG_FILE_ID);fd.append("file",blob,"krishna-control-center.json");await req(`/storage/buckets/${APPWRITE.bucketId}/files`,{method:"POST",body:fd})}catch(e){console.warn("Cloud settings sync failed",e)}},350)}catch(e){console.warn(e)}}
function saveCfg(patchObj){const cfg={...getCfg(),...patchObj};localStorage.setItem(CONFIG_KEY,JSON.stringify(cfg));syncCloudConfig(cfg);return cfg}
function logActivity(text){let a=[];try{a=JSON.parse(localStorage.getItem(ACTIVITY_KEY)||"[]")}catch{}a.unshift({text,time:new Date().toISOString()});a=a.slice(0,80);localStorage.setItem(ACTIVITY_KEY,JSON.stringify(a));renderActivity()}
function downloadJson(name,obj){const b=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function loadControlCenter(){const c=getCfg();$("hornEnabled").checked=c.hornEnabled;$("hornVolume").value=c.hornVolume;$("hornVolumeText").textContent=c.hornVolume+"%";$("defaultVolume").value=c.defaultVolume;$("defaultVolumeText").textContent=c.defaultVolume+"%";$("defaultShuffle").checked=c.defaultShuffle;$("siteTitle").value=c.siteTitle;$("siteTagline").value=c.siteTagline;$("highwayStatus").value=c.highwayStatus;$("playlistTitle").value=c.playlistTitle;$("autoplayPref").checked=c.autoplayPref;$("repeatPref").checked=c.repeatPref;$("badgeText").value=c.badgeText;renderVibes();renderPlaylists();renderActivity()}

/* ---------- Dashboard ---------- */
function renderDashboard(){const c=getCfg();const featured=$("featuredSong");featured.innerHTML=`<option value="">Automatic first published song</option>`+songs.map(s=>`<option value="${s.id}">${esc(s.title)} — ${esc(s.artist)}</option>`).join("");featured.value=c.featuredSongId||"";const recent=[...songs].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,4);$("recentSongs").innerHTML=recent.length?recent.map(s=>`<div class="mini-row"><div><strong>${esc(s.title)}</strong><small>${esc(s.artist)}</small></div><em>${s.active?"Published":"Hidden"}</em></div>`).join(""):`<div class="empty-state">No songs yet</div>`;renderTopSongs()}
$("saveFeatured").onclick=()=>{saveCfg({featuredSongId:$("featuredSong").value});logActivity("Featured song updated");toast("Featured song saved")};
async function loadStorageUsage(){try{const d=await req(`/storage/buckets/${APPWRITE.bucketId}/files?queries[]=${encodeURIComponent(JSON.stringify({method:"limit",values:[100]}))}`);const files=d.files||[];const bytes=files.reduce((n,f)=>n+Number(f.sizeOriginal||0),0);const mb=bytes/1024/1024;$("storageUsed").textContent=mb<1024?`${mb.toFixed(1)} MB`:`${(mb/1024).toFixed(2)} GB`;const pct=Math.min(100,Math.max(4,mb/20));$("storageBar").style.width=pct+"%";$("storageHint").textContent=`${files.length} media files found in Appwrite Storage.`}catch{$("storageUsed").textContent="Online";$("storageHint").textContent="Storage is connected; exact usage is unavailable for this session."}}

/* ---------- Playlists ---------- */
function renderPlaylists(){const c=getCfg(),pls=Array.isArray(c.playlists)&&c.playlists.length?c.playlists:defaults.playlists;$("playlistCards").innerHTML=pls.map(p=>{const published=p.published===true;return `<div class="playlist-card"><div><strong>${esc(p.name)}</strong><small>${(p.songIds||[]).length} songs • ${published?"Published folder":"Not published"}</small></div><div class="playlist-card-actions"><button class="playlist-publish-btn ${published?"is-published":""}" data-publish-playlist="${p.id}">${published?"✓ Published":"Publish"}</button>${p.id!=="highway"?`<button class="playlist-delete-btn" data-del-playlist="${p.id}">Delete</button>`:"<span class=\"status-chip\">DEFAULT</span>"}</div></div>`}).join("");$("playlistPicker").innerHTML=pls.map(p=>`<option value="${p.id}">${esc(p.name)}${p.published===true?" • Published":""}</option>`).join("");renderPlaylistSongPicker();document.querySelectorAll("[data-del-playlist]").forEach(b=>b.onclick=()=>deletePlaylist(b.dataset.delPlaylist));document.querySelectorAll("[data-publish-playlist]").forEach(b=>b.onclick=()=>togglePlaylistPublish(b.dataset.publishPlaylist));if($("songFolderPicker")&&!$("modal").classList.contains("hidden"))renderSongFolderPicker($("editId").value||"")}
function renderPlaylistSongPicker(){const c=getCfg(),p=(c.playlists||[]).find(x=>x.id===$("playlistPicker").value)||(c.playlists||[])[0];if(!p){$("playlistSongPicker").innerHTML="";return}$("playlistSongPicker").innerHTML=songs.map(s=>`<label class="check-item"><input type="checkbox" data-play-song="${s.id}" ${(p.songIds||[]).includes(s.id)?"checked":""}><span>${esc(s.title)} <small>• ${esc(s.artist)}</small></span></label>`).join("")}
$("playlistPicker").onchange =
  renderPlaylistSongPicker;


/* ======================================
   PREMIUM CREATE PLAYLIST MODAL
====================================== */

const playlistModal =
  $("playlistModal");

const newPlaylistName =
  $("newPlaylistName");


function openPlaylistModal(){

  playlistModal.classList.remove("hidden");

  document.body.style.overflow =
    "hidden";

  newPlaylistName.value = "";

  setTimeout(()=>{
    newPlaylistName.focus();
  },180);

}


function closePlaylistModal(){

  playlistModal.classList.add("hidden");

  document.body.style.overflow = "";

  newPlaylistName.value = "";

}


/* NEW PLAYLIST BUTTON */

$("newPlaylist").onclick =
  openPlaylistModal;


/* CLOSE */

$("closePlaylistModal").onclick =
  closePlaylistModal;


$("cancelPlaylistModal").onclick =
  closePlaylistModal;


/* BACKDROP CLICK */

playlistModal.addEventListener(
  "click",
  e=>{

    if(e.target === playlistModal){

      closePlaylistModal();

    }

  }
);


/* CREATE PLAYLIST */

function createNewPlaylist(){

  const name =
    newPlaylistName.value.trim();


  if(!name){

    newPlaylistName.focus();

    newPlaylistName.style.borderColor =
      "#ff6e4a";

    setTimeout(()=>{

      newPlaylistName.style.borderColor =
        "";

    },900);

    toast("Playlist name enter करें");

    return;

  }


  const c =
    getCfg();


  const id =
    "pl_" +
    Date.now().toString(36);


  c.playlists = [
    ...(c.playlists || []),

    {
      id,
      name,
      songIds:[],
      published:false
    }

  ];


  saveCfg(c);

  logActivity(
    `Created playlist: ${name}`
  );


  renderPlaylists();

  closePlaylistModal();

  toast(
    `Playlist "${name}" created`
  );

}


/* CREATE BUTTON */

$("createPlaylistBtn").onclick =
  createNewPlaylist;


/* ENTER = CREATE */

newPlaylistName.addEventListener(
  "keydown",
  e=>{

    if(e.key === "Enter"){

      e.preventDefault();

      createNewPlaylist();

    }

  }
);


/* ESC = CLOSE */

document.addEventListener(
  "keydown",
  e=>{

    if(
      e.key === "Escape" &&
      !playlistModal.classList.contains("hidden")
    ){

      closePlaylistModal();

    }

  }
);
function togglePlaylistPublish(id){const c=getCfg(),p=(c.playlists||[]).find(x=>x.id===id);if(!p)return;const next=!(p.published===true);c.playlists=(c.playlists||[]).map(x=>x.id===id?{...x,published:next}:x);saveCfg(c);logActivity(`${next?"Published":"Unpublished"} playlist folder: ${p.name}`);renderPlaylists();toast(next?"Playlist folder published on website":"Playlist folder hidden from website")}
function deletePlaylist(id){const c=getCfg(),p=(c.playlists||[]).find(x=>x.id===id);if(!p||!confirm(`Delete playlist "${p.name}"?`))return;c.playlists=(c.playlists||[]).filter(x=>x.id!==id);saveCfg(c);logActivity(`Deleted playlist: ${p.name}`);renderPlaylists()}
$("savePlaylistMap").onclick=()=>{const c=getCfg(),id=$("playlistPicker").value,ids=[...document.querySelectorAll("[data-play-song]:checked")].map(x=>x.dataset.playSong);c.playlists=(c.playlists||[]).map(p=>p.id===id?{...p,songIds:ids}:p);saveCfg(c);logActivity("Playlist songs updated");renderPlaylists();toast("Playlist saved")};

/* ---------- Live listeners ---------- */
async function refreshListeners(){try{const url=`/databases/${APPWRITE.databaseId}/tables/listeners/rows?queries[]=${encodeURIComponent(JSON.stringify({method:"limit",values:[100]}))}`;const d=await req(url);const cutoff=Date.now()-45000,rows=(d.rows||[]).filter(r=>new Date(r.lastSeen).getTime()>=cutoff);$("liveNow").textContent=rows.length;$("listenerCountBig").textContent=rows.length;$("listenerRefresh").textContent=new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});$("listenerList").innerHTML=rows.length?rows.map((r,i)=>`<div class="listener-row"><div class="listener-left"><span class="listener-avatar">${i+1}</span><div><strong>Listener ${String(r.sessionId||"").slice(-6)||i+1}</strong><small>Active now</small></div></div><small>${Math.max(0,Math.round((Date.now()-new Date(r.lastSeen).getTime())/1000))}s ago</small></div>`).join(""):`<div class="empty-state">No active listeners in the last 45 seconds.</div>`}catch(e){$("listenerList").innerHTML=`<div class="empty-state">Live listener table unavailable. Website counter will continue independently.</div>`}}
$("refreshListeners").onclick=refreshListeners;setInterval(()=>{if(!$("app").classList.contains("hidden"))refreshListeners()},15000);

/* ---------- Analytics ---------- */
function getAnalytics(){try{return JSON.parse(localStorage.getItem(ANALYTICS_KEY)||"{}")||{}}catch{return{}}}
function renderTopSongs(){const a=getAnalytics(),rank=[...songs].sort((x,y)=>(a[y.id]||0)-(a[x.id]||0)).slice(0,4);$("topSongs").innerHTML=rank.length?rank.map((s,i)=>`<div class="mini-row"><div><strong>${i+1}. ${esc(s.title)}</strong><small>${esc(s.artist)}</small></div><em>${a[s.id]||0} plays</em></div>`).join(""):`<div class="empty-state">Playback data appears after listening.</div>`}
function renderAnalytics(){const a=getAnalytics(),max=Math.max(1,...songs.map(s=>a[s.id]||0));$("analyticsBars").innerHTML=songs.length?songs.slice(0,12).map(s=>`<div class="bar-row"><div class="bar-copy"><span>${esc(s.title)}</span><b>${a[s.id]||0}</b></div><div class="bar-track"><span style="width:${Math.max(2,((a[s.id]||0)/max)*100)}%"></span></div></div>`).join(""):`<div class="empty-state">No analytics yet</div>`;const total=Object.values(a).reduce((n,v)=>n+Number(v||0),0),top=[...songs].sort((x,y)=>(a[y.id]||0)-(a[x.id]||0))[0];$("totalPlays").textContent=total;$("topSongName").textContent=top?.title||"—";$("libraryHealth").textContent=songs.length&&songs.every(s=>s.audioFileId)?"Excellent":"Needs check";renderTopSongs()}

/* ---------- Vibes ---------- */
function renderVibes(){const c=getCfg(),v=Array.isArray(c.vibes)?c.vibes:defaults.vibes;$("vibeList").innerHTML=v.map((x,i)=>`<div class="edit-vibe"><input data-vibe-index="${i}" value="${esc(x)}"><button data-remove-vibe="${i}">×</button></div>`).join("");$("quotePreview").textContent=v[0]||"Add a highway vibe message";document.querySelectorAll("[data-remove-vibe]").forEach(b=>b.onclick=()=>{const c=getCfg();c.vibes=(c.vibes||[]).filter((_,i)=>i!==Number(b.dataset.removeVibe));saveCfg(c);renderVibes()});document.querySelectorAll("[data-vibe-index]").forEach(inp=>inp.oninput=()=>{$("quotePreview").textContent=inp.value||"Highway vibe"})}
$("addVibe").onclick=()=>{const c=getCfg();c.vibes=[...(c.vibes||[]),"नई हाईवे वाइब लिखें…"];saveCfg(c);renderVibes()};$("saveVibes").onclick=()=>{const vibes=[...document.querySelectorAll("[data-vibe-index]")].map(x=>x.value.trim()).filter(Boolean);saveCfg({vibes});logActivity("Vibe messages updated");renderVibes();toast("Vibe messages saved")};

/* ---------- Sound settings ---------- */
$("hornVolume").oninput=e=>$("hornVolumeText").textContent=e.target.value+"%";$("defaultVolume").oninput=e=>$("defaultVolumeText").textContent=e.target.value+"%";
function playTestHorn(){const c=getCfg(),vol=Number($("hornVolume").value)/100;try{const C=window.AudioContext||window.webkitAudioContext,ctx=new C(),o1=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain();o1.type="square";o2.type="sawtooth";o1.frequency.value=180;o2.frequency.value=145;g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(Math.max(.001,vol),ctx.currentTime+.03);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.55);o1.connect(g);o2.connect(g);g.connect(ctx.destination);o1.start();o2.start();o1.stop(ctx.currentTime+.55);o2.stop(ctx.currentTime+.55);setTimeout(()=>ctx.close(),700)}catch{}}
$("testHorn").onclick=playTestHorn;$("saveSoundSettings").onclick=()=>{saveCfg({hornEnabled:$("hornEnabled").checked,hornVolume:Number($("hornVolume").value),defaultVolume:Number($("defaultVolume").value),defaultShuffle:$("defaultShuffle").checked});logActivity("Sound settings updated");toast("Sound settings saved")};

/* ---------- Website settings ---------- */
$("saveWebsiteSettings").onclick=()=>{saveCfg({siteTitle:$("siteTitle").value.trim()||defaults.siteTitle,siteTagline:$("siteTagline").value.trim()||defaults.siteTagline,highwayStatus:$("highwayStatus").value.trim()||defaults.highwayStatus,playlistTitle:$("playlistTitle").value.trim()||defaults.playlistTitle,autoplayPref:$("autoplayPref").checked,repeatPref:$("repeatPref").checked,badgeText:$("badgeText").value.trim()||defaults.badgeText});logActivity("Website settings updated");toast("Website settings saved")};

/* ---------- Backup & activity ---------- */
function renderActivity(){let a=[];try{a=JSON.parse(localStorage.getItem(ACTIVITY_KEY)||"[]")}catch{}$("activityLog").innerHTML=a.length?a.map(x=>`<div class="activity-item"><b>${esc(x.text)}</b><small>${new Date(x.time).toLocaleString("en-IN")}</small></div>`).join(""):`<div class="empty-state">No activity recorded yet.</div>`}
$("clearActivity").onclick=()=>{if(confirm("Clear activity log?")){localStorage.removeItem(ACTIVITY_KEY);renderActivity()}};
$("fullBackup").onclick=()=>downloadJson(`krishna-music-backup-${new Date().toISOString().slice(0,10)}.json`,{version:2,exportedAt:new Date().toISOString(),songs,controlCenter:getCfg(),analytics:getAnalytics()});
$("restoreSettings").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(d.controlCenter)localStorage.setItem(CONFIG_KEY,JSON.stringify({...defaults,...d.controlCenter}));else if(d.siteTitle||d.vibes)localStorage.setItem(CONFIG_KEY,JSON.stringify({...defaults,...d}));if(d.analytics)localStorage.setItem(ANALYTICS_KEY,JSON.stringify(d.analytics));loadControlCenter();renderAnalytics();logActivity("Settings restored from backup");toast("Settings restored")}catch{alert("Invalid backup file")}};r.readAsText(f);e.target.value=""};
