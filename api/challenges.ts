import {createZenGame,pickZenTile} from '../src/core/zen.js';
import {gameIdentity,gameError,newCode,insertGame,mutateGame} from './gameStore.js';
export default async function handler(req:any,res:any){
  res.setHeader('Cache-Control','no-store');
  try{
    const {db,id,name}=await gameIdentity(req), input={...req.query,...req.body},action=input.action;
    if(req.method!=='POST')throw gameError('Gunakan POST.',405);
    if(action==='create'){
      const state={id:newCode(),seed:crypto.randomUUID(),host:name,createdAt:Date.now(),expiresAt:Date.now()+86400000,players:[],revision:1};
      await insertGame(db,'challenge',state);return res.json(state);
    }
    const code=String(input.code||'').trim().toUpperCase();if(!/^[A-Z0-9]{6}$/.test(code))throw gameError('Kode harus 6 karakter.');
    const state=await mutateGame(db,code,'challenge',s=>{
      let me=s.players.find((p:any)=>p.accountId===id);
      if(action==='view')return;
      if(action==='start'){
        if(me?.finishedAt)throw gameError('Percobaanmu sudah selesai.');
        if(!me){if(s.players.length>=20)throw gameError('Tantangan sudah penuh.');me={accountId:id,name,startedAt:Date.now()};s.players.push(me);}return;
      }
      if(action==='finish'){
        if(!me)throw gameError('Mulai tantangan dahulu.');if(me.finishedAt)return;
        if(!Array.isArray(input.moves)||input.moves.length!==54||!input.moves.every(Number.isInteger))throw gameError('Riwayat langkah tidak valid.');
        let game=createZenGame(s.seed,3);
        for(const move of input.moves){const next=pickZenTile(game,move);if(next===game)throw gameError('Langkah tidak sah.');game=next;}
        if(game.status!=='won')throw gameError('Papan belum selesai.');
        const seconds=Math.floor((Date.now()-me.startedAt)/1000);if(seconds<5)throw gameError('Durasi permainan tidak valid.');
        me.score=game.score+Math.max(0,600-seconds);me.finishedAt=Date.now();me.seconds=seconds;return;
      }
      throw gameError('Aksi tidak valid.');
    });
    return res.json({...state,players:state.players.map(({accountId,...p}:any)=>({...p,isMe:accountId===id}))});
  }catch(e:any){res.status(e.status||500).json({error:e.message||'Tantangan tidak dapat dimuat.'});}
}