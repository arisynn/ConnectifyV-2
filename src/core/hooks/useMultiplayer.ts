import {useState,useEffect,useRef} from 'react';
import {useGame} from '../../GameContext';
import {useProfile} from '../profile/ProfileContext';
import {gameApi} from '../../lib/gameApi';
export interface Room {id:string;host:string;status:'WAITING'|'STARTING'|'PLAYING'|'FINISHED';players:any[];mode:string;wager:any;winner?:string;finishReason?:string;startAt?:number;endAt?:number;gameMode?:string;matchId?:string;revision?:number;board?:any[][];currentBoard?:any[][];}
export const useMultiplayer=()=>{
  const {user}=useGame(),{profile}=useProfile();const [room,setRoom]=useState<Room|null>(null),[error,setError]=useState<string|null>(null),[isLoading,setLoading]=useState(false),[connection,setConnection]=useState('CONNECTED');
  const roomRef=useRef<Room|null>(null),active=useRef(true),polling=useRef(false),failures=useRef(0);
  const key=`connectify-room-${profile.id}`;
  const accept=(r:Room)=>{if(!active.current)return;const old=roomRef.current;if(old?.id===r.id&&(old.revision||0)>(r.revision||0))return;roomRef.current=r;setRoom(r);localStorage.setItem(key,r.id);};
  const apiCall=async(action:string,payload:any={})=>{setLoading(true);setError(null);try{const data=await gameApi('multiplayer',action,payload);const r=data.room||data;accept(r);return data;}catch(e:any){setError(e.message);throw e;}finally{setLoading(false);}};
  useEffect(()=>{
    active.current=true;
    const sync=async()=>{const code=roomRef.current?.id||localStorage.getItem(key);if(!code||polling.current)return;polling.current=true;
      try{const r=await gameApi('multiplayer','sync',{roomId:code});accept(r);failures.current=0;setConnection('CONNECTED');}
      catch(e:any){failures.current++;setConnection('RECONNECTING');if(/tidak ditemukan|kedaluwarsa|bukan anggota/.test(e.message)){localStorage.removeItem(key);roomRef.current=null;setRoom(null);setError(e.message);}}
      finally{polling.current=false;}};
    sync();const timer=setInterval(sync,2000);return()=>{active.current=false;clearInterval(timer);};
  },[key]);
  const createRoom=async(gameMode='onet')=>apiCall('create',{gameMode,level:profile.highestLevel});
  const joinRoom=async(roomId:string)=>apiCall('join',{roomId});
  const leaveRoom=async()=>{const r=roomRef.current;roomRef.current=null;setRoom(null);localStorage.removeItem(key);if(r)try{await gameApi('multiplayer','leave',{roomId:r.id});}catch(e:any){setError(e.message);}};
  const mutate=async(action:string,payload:any={})=>{const r=roomRef.current;if(!r)return;try{return await apiCall(action,{roomId:r.id,matchId:r.matchId,...payload});}catch{return null;}};
  return {room,error,isLoading,connection,createRoom,joinRoom,leaveRoom,setReady:(ready:boolean)=>mutate('ready',{ready}),startMatch:(_board?:any[][])=>mutate('start_match'),readyForGame:()=>mutate('ready_for_game'),completeMatch:()=>mutate('complete'),reportLoss:()=>mutate('report_loss'),reportTimeUp:()=>mutate('time_up'),rematch:()=>mutate('rematch')};
};