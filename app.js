const SCHOOL={lat:31.56812830756984,lng:75.60527693091984};
const BUS_IDS=Array.from({length:10},(_,i)=>`Bus ${i+1}`);
const API_URL='https://amardeep-bus-api.onrender.com'; // Existing Render backend
const DRIVER_PIN='1234', ADMIN_PIN='4321'; // Demo-only client-side PINs, NOT secure authentication.
const app=document.querySelector('#app');let watchId=null,pollId=null,map=null,markers=[],schoolMarker=null;
const busOptions=()=>BUS_IDS.map(b=>`<option>${b}</option>`).join('');
const distance=(a,b)=>{const r=Math.PI/180,dlat=(b.lat-a.lat)*r,dlng=(b.lng-a.lng)*r,x=Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlng/2)**2;return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))};
const eta=(km,speed)=>speed>=3?`${Math.round(km/speed*60)} min`:'Unavailable';
const speedText=s=>`${Math.round(s||0)} km/h`;
// OSRM public demo is for light testing only; no API key required.
async function roadDistance(bus, parent) {
  const coords = `${bus.lng},${bus.lat};${parent.lng},${parent.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false&steps=false`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Road distance service unavailable');
  const result = await response.json();
  if (result.code !== 'Ok' || !result.routes?.length) throw new Error('No road route found');
  return {km:result.routes[0].distance/1000, minutes:Math.ceil(result.routes[0].duration/60)};
}

const api=async(path,options={})=>{if(!API_URL)throw Error('Backend not configured. See README.');const response=await fetch(API_URL+path,options);if(!response.ok)throw Error('Backend error '+response.status);return response.json()};
const clear=()=>{if(pollId)clearInterval(pollId);pollId=null;if(watchId!==null)navigator.geolocation.clearWatch(watchId);watchId=null;if(map){map.remove();map=null}markers=[];schoolMarker=null};
const status=(text)=>{const el=document.querySelector('#status');if(el)el.textContent=text};
function pinGate(role){const expected=role==='driver'?DRIVER_PIN:ADMIN_PIN;app.innerHTML=`<section class="panel"><h2>${role==='driver'?'Driver':'Management'} access</h2><label for="pin">Demo PIN</label><input id="pin" type="password" inputmode="numeric" autocomplete="off"><button id="unlock">Continue</button><p class="notice">This PIN is visible in source code and does not protect the backend. Demo only.</p><p id="status"></p></section>`;document.querySelector('#unlock').onclick=()=>{if(document.querySelector('#pin').value!==expected){status('Incorrect PIN');return}role==='driver'?driver():management()}}
function driver(){app.innerHTML=`<section class="panel"><h2>Driver dashboard</h2><label for="bus">Select bus</label><select id="bus">${busOptions()}</select><p id="status">Requesting GPS permission…</p><button id="start">Start Route Tracking</button><button class="danger" id="stop">Stop Tracking</button><div class="metrics"><div class="metric">Speed<strong id="speed">—</strong></div><div class="metric">GPS<strong id="coords">—</strong></div></div><small>Keep this page open and visible while driving. Never interact with your phone while driving.</small></section>`;document.querySelector('#start').onclick=startTracking;document.querySelector('#stop').onclick=stopTracking;if(navigator.geolocation)navigator.geolocation.getCurrentPosition(()=>status('GPS ready. Tap Start Route Tracking.'),e=>status('GPS: '+e.message),{enableHighAccuracy:true,timeout:15000});else status('Geolocation unavailable.');}
async function startTracking(){if(watchId!==null)return;if(!API_URL){status('Configure the backend URL in app.js first.');return}const bus=document.querySelector('#bus').value;document.querySelector('#bus').disabled=true;watchId=navigator.geolocation.watchPosition(async p=>{const data={bus,lat:p.coords.latitude,lng:p.coords.longitude,speed:Math.max(0,(p.coords.speed||0)*3.6),timestamp:new Date().toISOString()};document.querySelector('#speed').textContent=speedText(data.speed);document.querySelector('#coords').textContent=`${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`;try{await api('/api/location',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});status('Tracking active. Last update: '+new Date().toLocaleTimeString())}catch(e){status(e.message)}},e=>status('GPS error: '+e.message),{enableHighAccuracy:true,maximumAge:2000,timeout:15000});status('Starting tracking…')}
async function stopTracking(){if(watchId!==null)navigator.geolocation.clearWatch(watchId);watchId=null;const bus=document.querySelector('#bus').value;document.querySelector('#bus').disabled=false;try{if(API_URL)await api('/api/location/'+encodeURIComponent(bus),{method:'DELETE'});status('Tracking stopped.')}catch(e){status('Local tracking stopped. Backend: '+e.message)}}
function makeMap(){
  map=L.map('map').setView([SCHOOL.lat,SCHOOL.lng],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap contributors',maxZoom:19
  }).addTo(map);
  // Permanent campus marker: shown only on Parent and Management maps.
  const schoolIcon=L.divIcon({className:'school-pin',html:'<span aria-label="School campus"><b>🏫</b></span>',iconSize:[38,38],iconAnchor:[19,36],popupAnchor:[0,-32]});
  schoolMarker=L.marker([SCHOOL.lat,SCHOOL.lng],{icon:schoolIcon,zIndexOffset:1000})
    .addTo(map).bindPopup('<strong>Amardeep Public Senior Secondary School</strong><br>Bhatnura Lubana, Jalandhar');
}
function focusMap(items){
  if(!map)return;
  const coords=[[SCHOOL.lat,SCHOOL.lng],...items.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng)).map(x=>[x.lat,x.lng])];
  if(coords.length>1)map.fitBounds(L.latLngBounds(coords),{padding:[40,40],maxZoom:15});
  else map.setView([SCHOOL.lat,SCHOOL.lng],14);
}

function setMarkers(items){
  if(!map)return;
  markers.forEach(m=>m.remove());
  markers=items.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng))
    .map(x=>L.marker([x.lat,x.lng]).addTo(map).bindPopup(x.name));
  // The school marker is separate and is never cleared during GPS refreshes.
  focusMap(items);
}
let parentPos=null, roadCache=null, roadLastAttempt=0, roadBusy=false, parentBusy=false, parentSession=0;
function parent(){parentSession++;parentPos=null;roadCache=null;roadLastAttempt=0;app.innerHTML=`<section class="panel"><h2>Parent dashboard</h2><label for="bus">Child's bus number</label><select id="bus">${busOptions()}</select><button id="locate">Use my location</button><label for="address">Or enter drop-off latitude, longitude</label><input id="address" placeholder="31.5681, 75.6053"><button id="apply">Use coordinates</button><p id="status" class="muted">Choose a bus to view its latest position.</p><div class="metrics"><div class="metric">Road distance<strong id="dist">—</strong></div><div class="metric">Estimated arrival<strong id="eta">—</strong></div><div class="metric">Bus speed<strong id="speed">—</strong></div></div><div id="map"></div><p class="map-legend">🏫 School campus · 🚌 Selected bus · 📍 Your location</p><small>Road distance and travel time are estimated using OSRM (no live traffic). Your selected coordinates are sent to OSRM for routing. GPS can become stale.</small></section>`;makeMap();document.querySelector('#bus').onchange=()=>{roadCache=null;roadLastAttempt=0;refreshParent()};document.querySelector('#locate').onclick=()=>navigator.geolocation?.getCurrentPosition(p=>{parentPos={lat:p.coords.latitude,lng:p.coords.longitude};roadCache=null;roadLastAttempt=0;refreshParent()},e=>status(e.message),{enableHighAccuracy:true});document.querySelector('#apply').onclick=()=>{const a=document.querySelector('#address').value.split(',').map(Number);if(a.length!==2||!Number.isFinite(a[0])||!Number.isFinite(a[1])||Math.abs(a[0])>90||Math.abs(a[1])>180){status('Enter valid latitude, longitude.');return}parentPos={lat:a[0],lng:a[1]};roadCache=null;roadLastAttempt=0;refreshParent()};refreshParent();pollId=setInterval(refreshParent,5000)}
async function refreshParent(){
  if(parentBusy)return;
  const session=parentSession;
  parentBusy=true;
  try{
    const selected=document.querySelector('#bus')?.value;
    if(!selected)return;
    const rows=await api('/api/locations');
    if(session!==parentSession||location.hash.replace(/^#\/?/,'')!=='parent')return;
    const bus=rows.find(x=>x.bus===selected);
    const fresh=bus&&Number.isFinite(Date.parse(bus.timestamp))&&Date.now()-Date.parse(bus.timestamp)<60000;
    const items=[];
    if(fresh)items.push({lat:bus.lat,lng:bus.lng,name:selected});
    if(parentPos)items.push({...parentPos,name:'Your location'});
    setMarkers(items);
    document.querySelector('#speed').textContent=fresh?speedText(bus.speed):'—';
    const distEl=document.querySelector('#dist'),etaEl=document.querySelector('#eta');
    if(!fresh||!parentPos){
      distEl.textContent='—';etaEl.textContent='—';roadCache=null;roadLastAttempt=0;
      status(!fresh?'Bus is offline or GPS location is stale.':'Share your location to calculate road distance.');
      return;
    }
    // Cache results for 30 seconds to limit public demo routing requests.
    // Recalculate sooner if the parent changes location or selected bus.
    const key=`${selected}:${parentPos.lat.toFixed(5)},${parentPos.lng.toFixed(5)}`;
    if(roadCache?.key!==key){roadCache=null;roadLastAttempt=0;}
    if(!roadBusy&&Date.now()-roadLastAttempt>=30000){
      roadBusy=true;roadLastAttempt=Date.now();
      try{
        const result=await roadDistance(bus,parentPos);
        if(session!==parentSession||document.querySelector('#bus')?.value!==selected)return;
        roadCache={...result,key};
      }catch(error){
        if(session!==parentSession)return;
        roadCache=null;status(error.message);
      }finally{roadBusy=false;}
    }
    if(roadCache?.key===key){
      distEl.textContent=roadCache.km.toFixed(2)+' km';
      etaEl.textContent=roadCache.minutes+' min';
      status('Bus GPS active. Road estimate updated periodically.');
    }else{
      distEl.textContent='Unavailable';etaEl.textContent='Unavailable';
      status('Road estimate unavailable. Please try again shortly.');
    }
  }catch(error){if(session===parentSession)status(error.message)}
  finally{parentBusy=false;}
}
function management(){app.innerHTML=`<section class="panel"><h2>Management dashboard</h2><p id="status">Loading…</p><div id="map"></div><p class="map-legend">🏫 School campus · 🚌 Active buses</p><div class="scroll"><table><thead><tr><th>Bus</th><th>Status</th><th>Speed</th><th>Distance from school</th><th>ETA to school</th><th>Last updated</th></tr></thead><tbody id="rows"></tbody></table></div></section>`;makeMap();refreshManagement();pollId=setInterval(refreshManagement,5000)}
async function refreshManagement(){try{const rows=await api('/api/locations');if(!document.querySelector('#rows'))return;const active=rows.filter(b=>BUS_IDS.includes(b.bus)&&Number.isFinite(b.lat)&&Number.isFinite(b.lng)&&Date.now()-Date.parse(b.timestamp)<60000);setMarkers(active.map(b=>({lat:b.lat,lng:b.lng,name:b.bus})));document.querySelector('#rows').innerHTML=BUS_IDS.map(id=>{const b=rows.find(x=>x.bus===id),fresh=b&&Date.now()-Date.parse(b.timestamp)<60000;if(!fresh)return `<tr><td>${id}</td><td>Offline</td><td>—</td><td>—</td><td>—</td><td>${b?new Date(b.timestamp).toLocaleString():'—'}</td></tr>`;const km=distance(b,SCHOOL);return `<tr><td>${id}</td><td>${b.speed>=3?'Moving':'Stopped'}</td><td>${speedText(b.speed)}</td><td>${km.toFixed(2)} km</td><td>${eta(km,b.speed)}</td><td>${new Date(b.timestamp).toLocaleString()}</td></tr>`}).join('');status('Refreshes every 5 seconds. ETA is a straight-line estimate.')}catch(e){status(e.message)}}
function route(){clear();const page=location.hash.replace(/^#\/?/,'')||'parent';if(page==='parent')parent();else if(page==='driver'||page==='management')pinGate(page);else location.hash='/parent'}window.addEventListener('hashchange',route);route();
