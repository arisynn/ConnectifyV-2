import {supabase} from './supabase';
export async function gameApi(endpoint:string,action:string,payload:any={}){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session)throw new Error('Masuk dahulu untuk bermain bersama.');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const res=await fetch(`/api/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({action,...payload}),signal:controller.signal});
    const data=await res.json();if(!res.ok||data.error)throw new Error(data.error||'Permintaan belum berhasil.');return data;
  }finally{clearTimeout(timer);}
}