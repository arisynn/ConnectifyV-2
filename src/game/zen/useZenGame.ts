import {useState,useRef,useEffect} from 'react';
import {createZenGame,pickZenTile,rescueZen,shuffleZen} from '../../core/zen';
import {stackBounds} from '../../core/tileStack';
import {useProfile} from '../../core/profile/ProfileContext';
import {useCDE} from '../../core/cde';
import {getTodayKey} from '../../core/economy';
export const useZenGame=(daily=false,challengeSeed?:string,onFinish?:(score:number,moves:number[])=>void)=>{
  const {profile}=useProfile(),cde=useCDE();
  const level=challengeSeed||daily?3:profile.zenLevel||1;
  const key=`connectify-trio-v4-${profile.id}-${challengeSeed||(daily?getTodayKey():'normal')}`;
  // Friend-challenge generation remains unchanged. Existing sessions are retained.
  const make=()=>createZenGame(challengeSeed||(daily?`daily-${getTodayKey()}`:`${Date.now()}-${Math.random()}`),level,challengeSeed?4:5);
  const [state,setState]=useState<any>(()=>{try{const s=JSON.parse(localStorage.getItem(key)||'null');return s?.status==='playing'||(challengeSeed&&s?.status==='won')?{...s,bounds:s.bounds||stackBounds(s.tiles),lastMatch:null}:make();}catch{return make();}});
  const stateRef=useRef(state),history=useRef<any[]>([]),submitted=useRef(false),locked=useRef(false);
  const [message,setMessage]=useState(''),[isBusy,setBusy]=useState(false);
  const commit=(next:any)=>{stateRef.current=next;setState(next);localStorage.setItem(key,JSON.stringify(next));};
  useEffect(()=>{localStorage.setItem(key,JSON.stringify(state));},[state,key]);
  useEffect(()=>{if(state.status==='won'&&!submitted.current){submitted.current=true;
    if(onFinish)onFinish(state.score,state.moves);
    else{localStorage.removeItem(key);cde.queueMutation('PROCESS_WIN',{game:'zen',level:state.level,score:state.score,matches:state.triples,isWinner:true,isFlawless:false,isDailyChallenge:daily}).catch(()=>setMessage('Hasil belum tersimpan. Periksa koneksi.'));}
  }},[state.status]);
  const pick=(id:number,reserve=false)=>{
    if(locked.current)return;
    const prev=stateRef.current,next=pickZenTile(prev,id,reserve);
    if(next===prev)return;
    history.current=[...history.current.slice(-9),prev];commit(next);setMessage('');
  };
  const useItem=async(id:string)=>{
    const current=stateRef.current;
    if(locked.current||current.status==='won'||challengeSeed)return;
    const field={zen_undo:'zenUndos',zen_rescue:'zenRescues',shuffle:'shuffles'}[id];
    if(!field||!(profile[field]>0)){setMessage('Item habis. Tersedia di Toko; mengulang tetap gratis.');return;}
    let next:any;
    if(id==='zen_undo'){
      if(!history.current.length){setMessage('Belum ada langkah untuk dibatalkan.');return;}
      next={...history.current[history.current.length-1],lastMatch:null};
    }else if(id==='zen_rescue'){
      if(!current.tray.length||current.reserve.length){setMessage('Kosongkan Simpanan dahulu, atau isi baki.');return;}
      next={...rescueZen(current),lastMatch:null};
    }else{
      const result=shuffleZen(current);if(result.error){setMessage(result.error);return;}next=result.state;
    }
    locked.current=true;setBusy(true);
    try{await cde.queueMutation('USE_ITEM',{itemId:id});
      if(id==='zen_undo')history.current.pop();else history.current=[];
      commit(next);setMessage(id==='shuffle'?'Papan diacak. Mulai dari gambar yang sudah ada di baki.':'');
    }catch{setMessage('Item belum dapat dipakai. Coba lagi.');}
    finally{locked.current=false;setBusy(false);}
  };
  const restart=()=>{if(locked.current)return;history.current=[];submitted.current=false;commit(make());setMessage('');};
  return {state,pick,useItem,restart,message,profile,isBusy};
};