import type {Request,Response} from 'express';
import {generateBoard,getPath,breakMatchedTiles,countRemaining,guaranteedShuffle,findHint} from '../src/core/board.js';
import {gameIdentity,gameError,newCode,insertGame,mutateGame} from './gameStore.js';
const publicRoom=(r:any,id:string)=>({...r,currentBoard:r.players.find((p:any)=>p.accountId===id)?.savedBoard,players:r.players.map(({savedBoard,accountId,...p}:any)=>p)});
const settle=(r:any,winner:string,reason:string)=>{r.status='FINISHED';r.winner=winner;r.finishReason=reason;};
const winnerByProgress=(r:any)=>{const [a,b]=r.players;if(!a||!b)return 'DRAW';return a.progress===b.progress?'DRAW':r.gameMode==='onet'?(a.progress<b.progress?a.name:b.name):(a.progress>b.progress?a.name:b.name);};
export default async function handler(req:Request,res:Response){
  res.setHeader('Cache-Control','no-store');
  try{
    const {db,id,name}=await gameIdentity(req);const input={...req.query,...req.body},action=String(input.action||'');
    if(!['GET','POST'].includes(req.method||''))throw gameError('Metode tidak diizinkan.',405);
    if(action!=='sync'&&req.method!=='POST')throw gameError('Gunakan POST.',405);
    if(action==='create'){
      if(!['onet','block-puzzle'].includes(input.gameMode||'onet'))throw gameError('Permainan tidak valid.');
      const r={id:newCode(),host:name,hostId:id,status:'WAITING',mode:'Duel Persahabatan',gameMode:input.gameMode||'onet',wager:null,revision:1,
        players:[{accountId:id,name,level:Math.max(1,Math.min(20,Number(input.level)||1)),ready:false,lastSync:Date.now(),connection:'CONNECTED'}],expiresAt:Date.now()+7200000};
      await insertGame(db,'live',r);return res.json(publicRoom(r,id));
    }
    const code=String(input.roomId||'').trim().toUpperCase();if(!/^[A-Z0-9]{6}$/.test(code))throw gameError('Kode room harus 6 karakter.');
    const r=await mutateGame(db,code,'live',r=>{
      const now=Date.now();let me=r.players.find((p:any)=>p.accountId===id);
      if(action==='join'&&!me){
        if(r.status!=='WAITING'||r.players.length>=2)throw gameError('Room penuh atau sedang bermain.');
        me={accountId:id,name,ready:false,level:1,lastSync:now,connection:'CONNECTED'};r.players.push(me);r.players.forEach((p:any)=>p.ready=false);
      }
      if(!me)throw gameError('Kamu bukan anggota room ini.',403);
      const lastSync=me.lastSync;me.lastSync=now;
      r.players.forEach((p:any)=>p.connection=now-p.lastSync>8000?'RECONNECTING':'CONNECTED');
      if(r.status==='STARTING'&&now-r.preparingAt>30000){r.status='WAITING';r.players.forEach((p:any)=>{p.ready=false;p.readyForGame=false;});}
      if(r.status==='PLAYING'){
        const disconnected=r.players.find((p:any)=>now-(p===me?lastSync:p.lastSync)>45000);
        if(disconnected)settle(r,r.players.find((p:any)=>p.accountId!==disconnected.accountId)?.name||'DRAW','DISCONNECT');
        else if(now>=r.endAt)settle(r,winnerByProgress(r),'TIME_UP');
      }
      if(['join','sync'].includes(action)){
        if(action==='sync'&&input.progress!==undefined&&r.gameMode==='block-puzzle'&&r.status==='PLAYING'&&input.matchId===r.matchId){const n=Number(input.progress);if(Number.isInteger(n)&&n>=me.progress&&n<=1000000)me.progress=n;}
        return;
      }
      if(action==='leave'){
        if(r.status==='PLAYING')settle(r,r.players.find((p:any)=>p.accountId!==id)?.name||'DRAW','FORFEIT');
        if(r.status==='STARTING')r.status='WAITING';r.players=r.players.filter((p:any)=>p.accountId!==id);
        r.players.forEach((p:any)=>p.ready=false);
        if(r.hostId===id&&r.players.length){r.hostId=r.players[0].accountId;r.host=r.players[0].name;}
        return;
      }
      if(action==='rematch'){
        if(r.status!=='FINISHED')throw gameError('Pertandingan belum selesai.');
        r.status='WAITING';r.winner=null;r.matchId=null;r.players.forEach((p:any)=>{p.ready=false;p.readyForGame=false;p.savedBoard=null;});return;
      }
      if(action==='ready'){
        if(r.status!=='WAITING')throw gameError('Tunggu hingga room siap.');me.ready=!!input.ready;return;
      }
      if(action==='start_match'){
        if(r.hostId!==id)throw gameError('Hanya host yang boleh mulai.',403);
        if(['STARTING','PLAYING'].includes(r.status))return;
        if(r.status!=='WAITING'||r.players.length!==2||!r.players.every((p:any)=>p.ready))throw gameError('Kedua pemain harus siap.');
        r.matchId=crypto.randomUUID();r.status='STARTING';r.preparingAt=now;r.winner=null;r.finishReason=null;
        r.board=r.gameMode==='onet'?generateBoard('sweets',Math.min(...r.players.map((p:any)=>p.level||1))):[];
        r.players.forEach((p:any)=>{p.progress=r.gameMode==='onet'?60:0;p.readyForGame=false;p.savedBoard=r.board;p.moveIds=[];});return;
      }
      if(action==='ready_for_game'){
        if(r.status!=='STARTING')return;me.readyForGame=true;
        if(r.players.length===2&&r.players.every((p:any)=>p.readyForGame)){r.status='PLAYING';r.startAt=now+4000;r.endAt=r.startAt+120000;}return;
      }
      if(['move','complete','report_loss','time_up'].includes(action)){
        if(input.matchId!==r.matchId)throw gameError('Hasil pertandingan lama diabaikan.',409);
        if(r.status==='FINISHED')return;
        if(r.status!=='PLAYING'||now<r.startAt)throw gameError('Permainan belum dimulai.');
        if(action==='move'){
          if(r.gameMode!=='onet')throw gameError('Mode tidak valid.');
          if(me.moveIds.includes(input.moveId))return;
          const {a,b}=input;
          if(!a||!b||![a.r,a.c,b.r,b.c].every(Number.isInteger)||a.r<1||a.r>10||b.r<1||b.r>10||a.c<1||a.c>6||b.c<1||b.c>6)throw gameError('Koordinat tidak valid.');
          const result=getPath(me.savedBoard,a.r,a.c,b.r,b.c);if(!result?.path)throw gameError('Pasangan atau jalur tidak valid.');
          me.savedBoard=breakMatchedTiles(me.savedBoard,a,b);me.progress=countRemaining(me.savedBoard);me.moveIds.push(input.moveId);
          if(me.progress&&!findHint(me.savedBoard))me.savedBoard=guaranteedShuffle(me.savedBoard);
          if(!me.progress)settle(r,me.name,'CLEARED');
        }else if(action==='complete'){
          if(r.gameMode==='onet'&&countRemaining(me.savedBoard)!==0)throw gameError('Papan belum selesai.');
          settle(r,me.name,'CLEARED');
        }else if(action==='report_loss')settle(r,r.players.find((p:any)=>p.accountId!==id)?.name||'DRAW','NO_MOVES');
        else if(now<r.endAt)throw gameError('Waktu masih berjalan.');
        return;
      }
      throw gameError('Aksi tidak tersedia. Duel tidak menggunakan taruhan permen.');
    });
    const view=publicRoom(r,id);return res.json(['start_match','ready_for_game'].includes(action)?{success:true,room:view}:view);
  }catch(e:any){res.status(e.status||500).json({error:e.message||'Multiplayer belum dapat tersambung.'});}
}