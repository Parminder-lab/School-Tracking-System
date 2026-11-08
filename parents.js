import { supabase, profileFor, kmBetween, fmtTime, ageText } from "./supabase.js";
const $=id=>document.getElementById(id);
let profile=null, here=null, channel=null, busData=null;

$("loginBtn").onclick=async()=>{
  try {
    const {error}=await supabase.auth.signInWithPassword({email:$("email").value,password:$("password").value});
    if(error) throw error;
  } catch(e) {$("loginMsg").textContent=e.message;}
};
$("logoutBtn").onclick=async()=>{if(channel)await supabase.removeChannel(channel);await supabase.auth.signOut();};

async function showUser(user){
  if(!user){profile=null;if(channel){await supabase.removeChannel(channel);channel=null;}
    $("login").classList.remove("hidden");$("app").classList.add("hidden");return;}
  try{
    profile=await profileFor(user);
    if(profile.role!=="parent")throw new Error("This account is not registered as a parent.");
    $("login").classList.add("hidden");$("app").classList.remove("hidden");
    $("welcome").textContent=`Welcome, ${profile.name||"Parent"}`;
    const ids=profile.bus_ids||[];
    $("busSelect").innerHTML=ids.map(id=>`<option value="${id}">${id}</option>`).join("");
    if(ids.length){watchBus(ids[0]);$("busSelect").onchange=()=>watchBus($("busSelect").value);}
    else $("parentStatus").textContent="No bus has been assigned to your account. Please contact school management.";
  }catch(e){$("loginMsg").textContent=e.message;await supabase.auth.signOut();}
}
supabase.auth.getSession().then(({data})=>showUser(data.session?.user||null));
supabase.auth.onAuthStateChange((_event,session)=>{showUser(session?.user||null);});

async function watchBus(id){
  if(channel){await supabase.removeChannel(channel);channel=null;}
  busData=null;render();
  const {data,error}=await supabase.from("bus_locations").select("*").eq("bus_id",id).maybeSingle();
  if(error){$("parentStatus").textContent=error.message;return;}
  busData=data;render();
  channel=supabase.channel("parent-bus-"+id)
    .on("postgres_changes",{event:"*",schema:"public",table:"bus_locations",filter:`bus_id=eq.${id}`},payload=>{
      busData=payload.new||null;render();
    }).subscribe();
}
$("locateBtn").onclick=()=>{
  if(!navigator.geolocation){$("parentStatus").textContent="Location is not supported.";return;}
  $("parentStatus").textContent="Getting your location…";
  navigator.geolocation.getCurrentPosition(p=>{
    here={lat:p.coords.latitude,lng:p.coords.longitude};render();
  },e=>$("parentStatus").textContent=e.message,{enableHighAccuracy:true,timeout:15000});
};
function render(){
  if(!busData||typeof busData.lat!=="number"){
    $("parentStatus").textContent="No bus location is available yet. The driver may not have started tracking.";
    $("distance").textContent="—";$("eta").textContent="—";$("updated").textContent="—";
    $("map").innerHTML='<div style="padding:20px">Map will appear when a bus location is available.</div>';
    $("mapLink").classList.add("hidden");return;
  }
  const bus={lat:busData.lat,lng:busData.lng};
  $("updated").textContent=ageText(busData.updated_at);
  $("parentStatus").textContent=busData.active?"Bus location is being shared.":"Last known location (driver tracking is currently off).";
  $("map").innerHTML=`<iframe loading="lazy" src="https://www.openstreetmap.org/export/embed.html?marker=${bus.lat}%2C${bus.lng}&zoom=15"></iframe>`;
  $("mapLink").href=`https://www.openstreetmap.org/?mlat=${bus.lat}&mlon=${bus.lng}#map=16/${bus.lat}/${bus.lng}`;
  $("mapLink").classList.remove("hidden");
  if(here){const km=kmBetween(here,bus);$("distance").textContent=km.toFixed(1)+" km";$("eta").textContent=fmtTime(km/30*60);}
  else{$("distance").textContent="Tap “Use my current location”";$("eta").textContent="—";}
}
