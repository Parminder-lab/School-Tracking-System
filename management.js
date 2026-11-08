import { supabase, profileFor, kmBetween, fmtTime, ageText } from "./supabase.js";
import { SCHOOL_LOCATION } from "./supabase-config.js";
const $=id=>document.getElementById(id);
let channel=null;
const ids=Array.from({length:10},(_,i)=>`Bus ${String(i+1).padStart(2,"0")}`);
const cache=Object.fromEntries(ids.map(id=>[id,null]));

$("loginBtn").onclick=async()=>{
  try{const {error}=await supabase.auth.signInWithPassword({email:$("email").value,password:$("password").value});if(error)throw error;}
  catch(e){$("loginMsg").textContent=e.message;}
};
$("logoutBtn").onclick=async()=>{if(channel)await supabase.removeChannel(channel);channel=null;await supabase.auth.signOut();};

async function showUser(user){
  if(!user){if(channel){await supabase.removeChannel(channel);channel=null;}
    $("login").classList.remove("hidden");$("app").classList.add("hidden");return;}
  try{
    const p=await profileFor(user);
    if(p.role!=="management")throw new Error("Management access only.");
    $("login").classList.add("hidden");$("app").classList.remove("hidden");
    await start();
  }catch(e){$("loginMsg").textContent=e.message;await supabase.auth.signOut();}
}
supabase.auth.getSession().then(({data})=>showUser(data.session?.user||null));
supabase.auth.onAuthStateChange((_event,session)=>{showUser(session?.user||null);});

async function start(){
  const {data,error}=await supabase.from("bus_locations").select("*");
  if(error){$("loginMsg").textContent=error.message;return;}
  (data||[]).forEach(x=>cache[x.bus_id]=x);render();
  if(channel)await supabase.removeChannel(channel);
  channel=supabase.channel("management-fleet")
    .on("postgres_changes",{event:"*",schema:"public",table:"bus_locations"},payload=>{
      const x=payload.new;
      if(x?.bus_id)cache[x.bus_id]=x;
      render();
    }).subscribe();
}
function render(){
  const entries=ids.map(id=>[id,cache[id]]);
  $("fleet").innerHTML=entries.map(([bus,x])=>`<div class="bus-card"><h3>${bus}</h3><div class="small">${x?.active?"🟢 Tracking active":"⚪ Not tracking"}</div><p>${x&&typeof x.lat==="number"?`${kmBetween({lat:x.lat,lng:x.lng},SCHOOL_LOCATION).toFixed(1)} km from school`:"No location yet"}</p></div>`).join("");
  $("rows").innerHTML=entries.map(([bus,x])=>{
    if(!x||typeof x.lat!=="number")return `<tr><td>${bus}</td><td>Offline / no data</td><td>—</td><td>—</td><td>—</td><td>${ageText(x?.updated_at)}</td></tr>`;
    const km=kmBetween({lat:x.lat,lng:x.lng},SCHOOL_LOCATION),speed=x.speed_mps&&x.speed_mps>0?x.speed_mps*3.6:30;
    return `<tr><td>${bus}</td><td>${x.active?"Active":"Stopped"}</td><td>${x.speed_mps==null?"—":(x.speed_mps*3.6).toFixed(1)+" km/h"}</td><td>${km.toFixed(1)} km</td><td>${fmtTime(km/speed*60)}</td><td>${ageText(x.updated_at)}</td></tr>`;
  }).join("");
}
