import { randomBytes } from 'node:crypto';
import { getSupabase } from './supabase.js';
export const newCode=()=>randomBytes(4).toString('hex').slice(0,6).toUpperCase();
export const gameError=(message:string,status=400)=>Object.assign(new Error(message),{status});
export async function gameIdentity(req:any){
  const token=req.headers.authorization?.replace(/^Bearer /,'');
  if(!token) throw gameError('Masuk dahulu untuk bermain bersama.',401);
  const db=getSupabase(); if(!db)throw gameError('Penyimpanan belum dikonfigurasi.',503);
  const {data,error}=await db.auth.getUser(token);
  if(error||!data?.user)throw gameError('Sesi tidak valid.',401);
  const {data:account}=await db.from('cde_accounts').select('id,username').eq('id',data.user.id).maybeSingle();
  if(!account)throw gameError('Profil pemain tidak ditemukan.',401);
  return {db,id:account.id,name:account.username};
}
export async function insertGame(db:any,kind:string,state:any){
  const {error}=await db.from('cde_game_rooms').insert({room_code:state.id,kind,state,revision:1,expires_at:new Date(state.expiresAt).toISOString()});
  if(error)throw gameError('Penyimpanan room belum siap. Terapkan migrasi game_rooms.',503);
}
export async function mutateGame(db:any,code:string,kind:string,change:(state:any)=>void){
  for(let retry=0;retry<5;retry++){
    const {data:row,error}=await db.from('cde_game_rooms').select('*').eq('room_code',code).maybeSingle();
    if(error)throw gameError('Gagal memuat room.',503);
    if(!row||row.kind!==kind)throw gameError('Room tidak ditemukan. Periksa kode.',404);
    if(Date.now()>new Date(row.expires_at).getTime())throw gameError('Kode kedaluwarsa. Buat room baru.',410);
    const state=JSON.parse(JSON.stringify(row.state));change(state);state.revision=Number(row.revision)+1;
    const {data:saved,error:saveError}=await db.from('cde_game_rooms').update({state,revision:state.revision}).eq('room_code',code).eq('revision',row.revision).select().maybeSingle();
    if(saveError)throw gameError('Room belum bisa disimpan.',503);
    if(saved)return state;
  }
  throw gameError('Room sedang sibuk. Coba lagi.',409);
}