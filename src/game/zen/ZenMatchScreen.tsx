import React from 'react';
import {ArrowLeft,RotateCcw,RefreshCw,Layers,ShoppingBag,Trophy,Sparkles} from 'lucide-react';
import {motion,AnimatePresence} from 'motion/react';
import {useGame} from '../../GameContext';
import {DynamicIcon} from '../../components/theme/DynamicIcon';
import {useZenGame} from './useZenGame';
import {TileTableau} from './TileTableau';
import './trio.css';
export default function ZenMatchScreen({challengeSeed,onFinish,onBack}:{challengeSeed?:string,onFinish?:(score:number,moves:number[])=>void,onBack?:()=>void}){
  const {navigate,gameMode}=useGame();const {state,pick,useItem,restart,message,profile,isBusy}=useZenGame(gameMode==='daily',challengeSeed,onFinish);
  const back=()=>onBack?onBack():navigate('levels');
  return <section data-testid="zen-screen" className="trio-screen absolute inset-0 z-[110] overflow-y-auto text-theme-text-primary font-sans">
    <header className="flex items-center justify-between gap-3 p-4 w-full max-w-4xl mx-auto">
      <button data-testid="zen-back" aria-label="Kembali" disabled={isBusy} onClick={back} className="game-square"><ArrowLeft size={21}/></button>
      <div data-testid="zen-title" className="text-center"><p className="text-[9px] font-black uppercase tracking-[.24em] text-theme-text-secondary">{challengeSeed?'Tantangan teman':gameMode==='daily'?'Tantangan hari ini':`Level ${state.level} · Susun tiga`}</p><h1 className="font-black text-2xl tracking-tight">Tile Trio</h1></div>
      <div data-testid="zen-score" className="game-square flex-col !py-2 !px-3"><span className="text-[8px] font-black uppercase tracking-widest text-theme-text-muted">Skor</span><strong className="text-lg leading-tight">{state.score}</strong></div>
    </header>
    <main className="trio-stage max-w-4xl w-full mx-auto px-4 pb-6">
      <div className="trio-board-column">
        <p data-testid="zen-instructions" className="trio-instructions"><Sparkles size={14}/> Buka tumpukannya. Temukan tiga yang sama.</p>
        <TileTableau state={state} onPick={pick}/>
      </div>
      <div className="trio-controls flex flex-col gap-4">
        <div className="hidden md:block"><p className="text-[10px] font-black tracking-[.2em] text-theme-text-muted uppercase">Satu tile, selangkah lebih dekat.</p><h2 className="text-2xl font-black mt-2">Rapikan tumpukanmu.</h2><p className="text-sm text-theme-text-secondary mt-3 leading-relaxed">Hanya tile yang tidak tertutup bisa diambil. Cocokkan 3 gambar di baki sebelum tujuh slot penuh.</p></div>
        <div className="trio-rack-panel">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2"><span data-testid="trio-tray-label">Baki pasangan</span><span data-testid="trio-tray-count" className={state.tray.length>=5?'text-rose-600':''}>{state.tray.length} / 7 slot</span></div>
          <div data-testid="zen-tray" className="grid grid-cols-7 gap-1.5">
            {Array.from({length:7},(_,i)=><div key={i} data-testid={`zen-slot-${i}`} className={`trio-rack-slot ${state.tray.length>=5?'trio-rack-warning':''}`}><AnimatePresence mode="wait">{state.tray[i]&&<motion.div key={state.tray[i].id} initial={{y:-16,scale:.7}} animate={{y:0,scale:1}} exit={{scale:0,opacity:0}} className="w-full h-full p-0.5"><DynamicIcon name={state.tray[i].kind} type="tiles" className="w-full h-full"/></motion.div>}</AnimatePresence></div>)}
          </div>
          <p data-testid="zen-progress" className="text-[10px] font-bold text-theme-text-secondary mt-3 flex justify-between"><span>{state.triples} trio ditemukan</span><span>{Math.round((state.total-state.tiles.length-state.tray.length-state.reserve.length)/state.total*100)}% bersih</span></p>
          <div className="min-h-4 mt-1" aria-live="polite">{state.lastMatch?<p key={state.lastMatch.serial} data-testid="trio-match-feedback" className="trio-match-feedback">Trio cocok! +100</p>:<p data-testid="trio-tray-advice" className={`text-[10px] font-bold ${state.tray.length>=5?'text-rose-600':'text-theme-text-muted'}`}>{state.tray.length>=5?'Baki menipis! Dahulukan gambar yang sudah sepasang.':'Bingkai emas = satu tile lagi untuk melengkapi trio.'}</p>}</div>
        </div>
        {!!state.reserve.length&&<div data-testid="zen-reserve" className="flex items-center justify-center gap-2 text-xs font-bold">Simpanan:{state.reserve.map((t:any)=><button key={t.id} data-testid={`zen-reserve-${t.id}`} onClick={()=>pick(t.id,true)} className="game-square !p-1"><DynamicIcon type="tiles" name={t.kind} className="w-9 h-9"/></button>)}</div>}
        {!challengeSeed&&<div className="grid grid-cols-3 gap-3">{[{id:'zen_undo',label:'Batal',count:profile.zenUndos,Icon:RotateCcw},{id:'shuffle',label:'Acak',count:profile.shuffles,Icon:RefreshCw},{id:'zen_rescue',label:'Simpan 3',count:profile.zenRescues,Icon:Layers}].map(({id,label,count,Icon})=><button key={id} data-testid={`zen-item-${id}`} onClick={()=>useItem(id)} disabled={state.status==='won'||isBusy} aria-busy={isBusy} className="trio-booster"><Icon size={21}/><span>{label}</span><b>{count||0}</b></button>)}</div>}
        {message&&<p data-testid="zen-message" role="status" className="game-panel text-xs font-bold">{message}</p>}
        {state.status==='lost'&&<div data-testid="zen-lost" className="game-panel text-center"><h2 className="font-black">Baki penuh. Coba strategi baru!</h2><p className="text-xs my-2">{challengeSeed?'Waktu tantangan tetap berjalan.':'Gunakan Batal / Simpan 3, atau ulang gratis.'}</p><button data-testid="zen-retry" onClick={restart} className="game-action bg-theme-primary-coral-pink w-full">Coba lagi</button></div>}
        {state.status==='won'&&<div data-testid="zen-won" className="game-panel text-center"><Trophy className="mx-auto text-amber-500" size={32}/><h2 className="font-black mt-2">Tumpukan beres!</h2><p className="text-xs my-3">{challengeSeed?'Kirim hasil ke papan skor teman.':'Progres peti dan misi bertambah. Klaim permen di sana.'}</p><button data-testid="zen-next" onClick={()=>challengeSeed?onFinish?.(state.score,state.moves):restart()} className="game-action bg-theme-primary-tropical-green w-full">{challengeSeed?'Kirim / lihat hasil':'Main level berikutnya'}</button></div>}
        <button data-testid="zen-shop" disabled={isBusy} onClick={()=>navigate('toko')} className="text-xs font-bold flex justify-center items-center gap-2 text-theme-text-secondary"><ShoppingBag size={13}/> Gambar tile & bantuan di toko</button>
      </div>
    </main>
  </section>;
}