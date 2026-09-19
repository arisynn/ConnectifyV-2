import React,{useState} from 'react';
import {motion} from 'motion/react';
import {ArrowLeft,Play,LayoutGrid,Puzzle,Users,Flame,Layers,Lock,ChevronDown,Check,Box,Infinity} from 'lucide-react';
import {useGame} from '../GameContext';
import {useProfile} from '../core/profile/ProfileContext';
import {CurrencyPill} from '../designs/KineticComponents';
import {useCDE} from '../core/cde';
import {DynamicIcon} from '../components/theme/DynamicIcon';
import {getTodayKey} from '../core/economy';
import {getOnetDifficulty,getBlockDifficulty} from '../core/difficulty';
export const LevelSelectScreen=()=>{
  const {navigate,setGameMode}=useGame(),{profile,updateProfile}=useProfile(),cde=useCDE();
  const [showLevels,setShowLevels]=useState(false),[chapter,setChapter]=useState(Math.floor(((profile.highestLevel||1)-1)/20));
  const dailyZen=Math.floor(Date.now()/86400000)%2===0,done=profile.dailyChallengeDate===getTodayKey();
  const playOnet=(level=profile.highestLevel||1)=>{setGameMode('normal');updateProfile({currentLevel:level});navigate('play');};
  const onetDifficulty=getOnetDifficulty(profile.highestLevel||1,profile.adaptive?.onet);
  const blockDifficulty=getBlockDifficulty(profile.blockPuzzleLevel||1,profile.adaptive?.block);
  const games=[
    {id:'onet',title:'Onet Classic',tag:`Level ${profile.highestLevel||1} · ${onetDifficulty.rank}`,desc:`${onetDifficulty.variety} gambar · ${onetDifficulty.timeLimit} detik. Kesulitan adaptif, pasangan makin menantang.`,color:'bg-theme-primary-coral-pink',Icon:LayoutGrid,tiles:['crab','crab'],play:()=>playOnet()},
    {id:'block',title:'Block Puzzle',tag:`Misi Lv. ${profile.blockPuzzleLevel||1} · ${blockDifficulty.rank}`,desc:'Pilih misi adaptif, atau Infinity tanpa target dan waktu.',color:'bg-theme-currency-candy-purple',Icon:Puzzle,tiles:[],play:()=>{setGameMode('normal');navigate('block-puzzle');}},
    {id:'zen',title:'Tile Trio',tag:'BARU · TILE BERTUMPUK',desc:'Buka lapisan demi lapisan. Cocokkan tiga sebelum baki penuh.',color:'bg-theme-primary-tropical-green',Icon:Layers,tiles:['ice_cream','ice_cream','ice_cream'],play:()=>{setGameMode('normal');navigate('zen');}},
  ];
  return <motion.section initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} data-testid="level-select-screen" className="absolute inset-0 z-[100] bg-theme-bg-main bg-[image:var(--asset-bg-global)] flex flex-col text-theme-text-primary">
    <header className="flex items-center justify-between p-4 bg-theme-surface-card-white border-b-theme-base border-theme-border-main"><button data-testid="levels-back" onClick={()=>navigate('home')} aria-label="Kembali" className="game-square"><ArrowLeft/></button><h1 data-testid="levels-heading" className="font-black uppercase text-lg">Waktunya bermain</h1><CurrencyPill type="candy" value={cde.permen} onClick={()=>navigate('wallet')}/></header>
    <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-5 pb-10">
      <div data-testid="levels-intro" className="mb-5"><p className="font-black text-2xl tracking-tight">Sedikit fokus. Banyak seru.</p><p className="text-xs font-bold text-theme-text-secondary mt-1">Main gratis, kumpulkan progres, bangun koleksimu.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {games.map(g=><article key={g.id} data-testid={`game-card-${g.id}`} className="game-panel relative flex flex-col gap-4">
          <div className="flex items-center gap-3"><div className={`game-square ${g.color}`} style={{background:undefined}}><g.Icon size={26}/></div><div className="min-w-0"><p className="text-[10px] font-black uppercase text-theme-text-muted">{g.tag}</p><h2 className="font-black text-xl uppercase tracking-tight">{g.title}</h2></div></div>
          <div className="flex items-center justify-between gap-3"><p className="font-bold text-xs text-theme-text-secondary max-w-[65%]">{g.desc}</p><div className="flex -space-x-3">{g.tiles.length?g.tiles.map((tile,i)=><div key={i} className="bg-white w-11 h-11 rounded-xl p-1 border-2 border-slate-800 rotate-6"><DynamicIcon name={tile} type="tiles" className="w-full h-full"/></div>):<div className="grid grid-cols-3 gap-1">{[0,1,2,3,4,5].map(i=><span key={i} className="block-cell-filled w-5 h-5 bg-rose-300 border-2 border-slate-800 rounded"/>)}</div>}</div></div>
          <button data-testid={`play-${g.id}`} onClick={g.play} className={`game-action w-full flex justify-center items-center gap-2 ${g.color}`}><Play size={18}/> {g.id==='block'?'MISI LEVEL':'MAINKAN'}</button>
          {g.id==='block'&&<button data-testid="play-block-endless" onClick={()=>{setGameMode('endless');navigate('block-puzzle');}} className="game-action w-full flex justify-center items-center gap-2 bg-theme-primary-sky-blue"><Infinity size={20}/> INFINITY · KEJAR REKOR</button>}
          {g.id==='onet'&&<button data-testid="toggle-level-map" onClick={()=>setShowLevels(!showLevels)} className="font-black text-xs flex items-center justify-center gap-1">Pilih level <ChevronDown size={14}/></button>}
        </article>)}
        <article data-testid="daily-challenge-card" className="game-panel flex flex-col gap-4">
          <div className="flex gap-3 items-center"><div className="game-square"><Flame size={26}/></div><div><p className="text-[10px] font-black text-theme-text-muted">BERGANTI SETIAP HARI</p><h2 className="font-black text-xl">Tantangan Harian</h2></div></div>
          <p data-testid="daily-challenge-description" className="font-bold text-xs text-theme-text-secondary">Hari ini: {dailyZen?'Tile Trio · 54 tile bertumpuk':'Onet cepat · 75 detik'}. Selesaikan untuk progres misi dan peti, bukan permen langsung.</p>
          <button data-testid="daily-challenge-play-button" onClick={()=>{setGameMode('daily');navigate(dailyZen?'zen':'play');}} className="game-action bg-theme-primary-warm-orange mt-auto flex justify-center gap-2">{done?<Check size={18}/>:<Flame size={18}/>} {done?'MAIN LAGI':'MULAI TANTANGAN'}</button>
        </article>
      </div>
      {showLevels&&<section data-testid="onet-level-map" className="game-panel mt-5"><div className="flex justify-between items-center mb-4"><button data-testid="levels-previous-chapter" disabled={chapter===0} onClick={()=>setChapter(chapter-1)} className="game-action !p-2 text-xs">Sebelumnya</button><h2 data-testid="levels-chapter" className="font-black text-sm">Bab {chapter+1}</h2><button data-testid="levels-next-chapter" disabled={(chapter+1)*20>(profile.highestLevel||1)} onClick={()=>setChapter(chapter+1)} className="game-action !p-2 text-xs">Berikutnya</button></div><div className="grid grid-cols-5 gap-3">{Array.from({length:20},(_,i)=>chapter*20+i+1).map(level=><button key={level} data-testid={`select-level-${level}`} disabled={level>(profile.highestLevel||1)} onClick={()=>playOnet(level)} className={`game-action aspect-square flex items-center justify-center ${level===(profile.highestLevel||1)?'bg-theme-primary-coral-pink':level<(profile.highestLevel||1)?'bg-theme-primary-tropical-green':'bg-theme-surface-card-soft'}`}>{level>(profile.highestLevel||1)?<Lock size={16}/>:level}</button>)}</div><p data-testid="onet-rule-note" className="text-xs mt-4 font-bold text-theme-text-muted">Papan 6 × 10. Mulai level 3, tile 2×1 / 1×2 memakai dua sel dan pecah menjadi tile 1×1.</p></section>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5"><button data-testid="play-multiplayer" onClick={()=>navigate('multiplayer')} className="game-action bg-theme-primary-sky-blue flex items-center justify-center gap-3"><Users size={22}/> Duel langsung · kode room</button><button data-testid="play-challenges" onClick={()=>navigate('challenges')} className="game-action bg-theme-primary-sunny-yellow flex items-center justify-center gap-3"><Box size={22}/> Tantang skor teman</button></div>
    </main>
  </motion.section>;
};