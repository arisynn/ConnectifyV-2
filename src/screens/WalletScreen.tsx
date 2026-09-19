import React, {useState,useEffect} from 'react';
import {ArrowLeft, Candy, ArrowDownLeft, ArrowUpRight, ShoppingBag} from 'lucide-react';
import {useGame} from '../GameContext';
import {useProfile} from '../core/profile/ProfileContext';
import {useCDE} from '../core/cde';
import {getEconomy,DAILY_EARNING_CAP} from '../core/economy';
const names={chest:'Peti hadiah',mission:'Misi',achievement:'Pencapaian',shop:'Pembelian toko',chest_speedup:'Percepat peti'};
export default function WalletScreen(){
  const {navigate}=useGame(),{profile}=useProfile(),cde=useCDE(); const [now,setNow]=useState(Date.now());
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(t);},[]);
  const e=getEconomy(profile,now); const [filter,setFilter]=useState('all');
  return <section data-testid="wallet-screen" className="absolute inset-0 z-[110] bg-theme-bg-main flex flex-col text-theme-text-primary">
    <header className="p-4 border-b-theme-base border-theme-border-main bg-theme-surface-card-white flex items-center gap-3"><button data-testid="wallet-back" aria-label="Kembali" onClick={()=>navigate('toko')} className="game-square"><ArrowLeft/></button><h1 data-testid="wallet-title" className="font-black text-xl uppercase">Dompet Permen</h1></header>
    <main className="max-w-2xl w-full mx-auto overflow-y-auto p-5 space-y-5">
      <div className="game-panel bg-theme-primary-sunny-yellow"><span data-testid="wallet-balance-label" className="font-bold text-xs uppercase">Saldo sekarang</span><div data-testid="wallet-balance" className="flex gap-3 items-center text-4xl font-black mt-2"><Candy size={32}/>{cde.permen}</div></div>
      <div className="game-panel"><div className="flex justify-between font-black text-sm"><span>Pemasukan hari ini</span><span data-testid="wallet-daily-income">{e.earnedToday} / {DAILY_EARNING_CAP}</span></div><div className="h-3 rounded-full bg-theme-surface-card-soft mt-3 overflow-hidden"><div style={{width:`${e.earnedToday}%`}} className="h-full bg-theme-primary-tropical-green"/></div><p data-testid="wallet-policy" className="text-xs text-theme-text-muted font-bold mt-3">Hanya peti, misi, dan pencapaian. Reset pukul 00.00 WIB. Belanja tidak mengembalikan kuota pendapatan. Klaim yang melebihi batas ditunda, bukan dihanguskan.</p></div>
      <div className="grid grid-cols-2 gap-3"><div className="game-panel"><ArrowDownLeft className="text-emerald-600"/><p className="text-xs mt-2">Total masuk</p><strong data-testid="wallet-total-income" className="text-xl">{e.totalEarned}</strong></div><div className="game-panel"><ArrowUpRight className="text-rose-500"/><p className="text-xs mt-2">Total keluar</p><strong data-testid="wallet-total-expense" className="text-xl">{e.totalSpent}</strong></div></div>
      <p data-testid="wallet-ledger-note" className="text-xs text-theme-text-muted">Riwayat mencakup transaksi sejak pembaruan ekonomi ini; saldo lamamu tetap utuh.</p>
      <div className="flex gap-2">{[['all','Semua'],['income','Masuk'],['expense','Keluar']].map(([id,label])=><button key={id} data-testid={`wallet-filter-${id}`} onClick={()=>setFilter(id)} aria-pressed={filter===id} className={`game-action text-xs flex-1 ${filter===id?'bg-theme-primary-sky-blue':'bg-theme-surface-card-white'}`}>{label}</button>)}</div>
      <div data-testid="wallet-transactions" className="space-y-3">{e.ledger.filter(t=>filter==='all'||(filter==='income'?t.amount>0:t.amount<0)).map((t,i)=><article data-testid={`wallet-transaction-${i}`} key={t.id} className="game-panel flex items-center justify-between gap-3"><div><p className="font-black text-sm">{names[t.source]||t.source}</p><p className="text-[10px] text-theme-text-muted">{new Date(t.at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB</p></div><strong className={t.amount>0?'text-emerald-600':'text-rose-500'}>{t.amount>0?'+':''}{t.amount}</strong></article>)}{!e.ledger.length&&<p data-testid="wallet-empty" className="game-panel text-center text-sm">Belum ada transaksi. Selesaikan misi untuk mulai menabung.</p>}</div>
      <button data-testid="wallet-shop" onClick={()=>navigate('toko')} className="game-action bg-theme-primary-coral-pink w-full flex justify-center gap-2"><ShoppingBag size={20}/> Lihat toko</button>
    </main>
  </section>;
}