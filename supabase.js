import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

export const auth = supabase.auth;

export async function profileFor(user) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role,name,bus_id,bus_ids")
    .eq("id", user.id)
    .single();
  if (error || !data) throw new Error("Your account has not been registered by school management.");
  return data;
}

export function kmBetween(a,b) {
  const R=6371,toRad=x=>x*Math.PI/180,dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng);
  const x=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
export function fmtTime(min) {
  if(!Number.isFinite(min)) return "—";
  if(min<1) return "Less than 1 min";
  return `${Math.round(min)} min`;
}
export function ageText(ts) {
  if(!ts) return "No update yet";
  const d=new Date(ts);
  const sec=Math.max(0,Math.round((Date.now()-d.getTime())/1000));
  return sec<60?`${sec}s ago`:`${Math.round(sec/60)} min ago`;
}
