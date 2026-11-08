import { supabase, profileFor } from "./supabase.js";
const $=id=>document.getElementById(id);
let watchId=null, profile=null, currentUser=null;

$("loginBtn").onclick=async()=>{
  try {
    const {error}=await supabase.auth.signInWithPassword({email:$("email").value,password:$("password").value});
    if(error) throw error;
    $("loginMsg").textContent="Signed in.";
  } catch(e) {$("loginMsg").textContent=e.message;}
};
$("logoutBtn").onclick=async()=>{await stopTracking();await supabase.auth.signOut();};

async function showUser(user) {
  if(!user) {
    currentUser=null; profile=null;
    $("login").classList.remove("hidden"); $("app").classList.add("hidden");
    return;
  }
  currentUser=user;
  try {
    profile=await profileFor(user);
    if(profile.role!=="driver" || !profile.bus_id) throw new Error("This account is not registered as a driver with an assigned bus.");
    $("login").classList.add("hidden"); $("app").classList.remove("hidden");
    $("welcome").textContent=`Welcome, ${profile.name||"Driver"}`;
    $("busSelect").innerHTML=`<option value="${profile.bus_id}">${profile.bus_id}</option>`;
  } catch(e) {$("loginMsg").textContent=e.message;await supabase.auth.signOut();}
}
supabase.auth.getSession().then(({data})=>showUser(data.session?.user||null));
supabase.auth.onAuthStateChange((_event,session)=>{showUser(session?.user||null);});

$("startBtn").onclick=()=>{
  if(!navigator.geolocation){$("trackStatus").textContent="GPS is not supported by this browser.";return;}
  if(!profile?.bus_id || !currentUser)return;
  if(!window.isSecureContext){$("trackStatus").textContent="Location tracking requires HTTPS. Open the GitHub Pages HTTPS link.";return;}
  $("trackStatus").textContent="Requesting GPS permission…";
  watchId=navigator.geolocation.watchPosition(async p=>{
    try {
      const payload={
        bus_id:profile.bus_id, lat:p.coords.latitude, lng:p.coords.longitude,
        speed_mps:p.coords.speed??null, heading:p.coords.heading??null,
        accuracy:p.coords.accuracy, updated_at:new Date().toISOString(),
        active:true, driver_uid:currentUser.id
      };
      const {error}=await supabase.from("bus_locations").upsert(payload,{onConflict:"bus_id"});
      if(error) throw error;
      $("trackStatus").textContent=`Sharing location • accuracy ±${Math.round(p.coords.accuracy)} m • ${new Date().toLocaleTimeString()}`;
      $("stopBtn").disabled=false;
    } catch(e) {$("trackStatus").textContent="Could not update location: "+e.message;}
  },e=>$("trackStatus").textContent="GPS error: "+e.message,{enableHighAccuracy:true,maximumAge:5000,timeout:20000});
  $("startBtn").disabled=true;
};
async function stopTracking(){
  if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null;}
  if(profile?.bus_id && currentUser){
    const {error}=await supabase.from("bus_locations").update({active:false,updated_at:new Date().toISOString()}).eq("bus_id",profile.bus_id);
    if(error) $("trackStatus").textContent="Tracking stopped locally; could not update server: "+error.message;
  }
  $("startBtn").disabled=false;$("stopBtn").disabled=true;
  if(!$("trackStatus").textContent.startsWith("Tracking stopped locally")) $("trackStatus").textContent="Tracking stopped.";
}
$("stopBtn").onclick=stopTracking;
