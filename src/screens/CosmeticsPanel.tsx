import React,{useState} from 'react';
import {Candy,Check,Frame,Box,Palette} from 'lucide-react';
import {COSMETICS,COSMETIC_FIELDS} from '../core/cosmetics';
import {useProfile} from '../core/profile/ProfileContext';
import {useCDE} from '../core/cde';
import {TileArtwork} from '../components/theme/TileArtwork';
import {KineticDialog} from '../designs/KineticPopups';
const categories=[['all','Semua'],['avatar','Avatar'],['frame','Bingkai'],['tiles','Paket tile'],['tile','Gambar satuan'],['block','Skin blok']];
export const CosmeticPreview=({item}:{item:any})=><div className="h-24 flex items-center justify-center gap-2 bg-gradient-to-br from-amber-50 to-sky-100 rounded-2xl border-2 border-slate-800 overflow-hidden p-3">
  {item.asset?<img src={item.asset} alt={item.name} className="h-full max-w-full object-contain"/>:item.category==='tiles'?<><TileArtwork name="beach_ball" pack={item.value} className="w-14 h-14"/><TileArtwork name="crab" pack={item.value} className="w-14 h-14"/></>:item.category==='frame'?<div className={`w-14 h-14 rounded-full border-[6px] ${item.value==='sunset'?'border-orange-400 outline outline-4 outline-amber-300':'border-teal-400 outline outline-4 outline-sky-300'} flex items-center justify-center`}><Frame className="text-slate-800"/></div>:<div className="grid grid-cols-3 gap-1 rotate-6">{[0,1,2,3,4,5].map(i=><span key={i} className="w-6 h-6 rounded-md border-2 border-slate-700" style={{background:item.value==='mint'?'linear-gradient(135deg,#c2f5db,#40b89b)':'repeating-linear-gradient(135deg,#ffa76c 0 8px,#f77d92 8px 16px)'}}/>)}</div>}
</div>;
export const CosmeticsPanel=({ownedOnly=false}:{ownedOnly?:boolean})=>{
  const {profile}=useProfile(),cde=useCDE();const [category,setCategory]=useState('all'),[pending,setPending]=useState<any>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const items=COSMETICS.filter(c=>(category==='all'||c.category===category)&&(!ownedOnly||profile.ownedCosmetics?.includes(c.id)));
  const buy=async()=>{if(!pending||busy)return;setBusy(true);try{await cde.queueMutation('PURCHASE_ITEM',{itemId:pending.id});setMessage(`${pending.name} masuk koleksimu.`);setPending(null);}catch(e:any){setMessage(e.message==='INSUFFICIENT_PERMEN'?'Permen belum cukup. Selesaikan misi dan buka peti.':'Pembelian belum berhasil.');}finally{setBusy(false);}};
  const equip=async(item:any)=>{try{await cde.queueMutation('EQUIP_COSMETIC',{itemId:item.id,category:item.category});setMessage(`${item.name} dipakai.`);}catch{setMessage('Kosmetik belum dapat dipakai.');}};
  return <div data-testid={ownedOnly?'owned-cosmetics':'cosmetics-shop'} className="space-y-4">
    <p data-testid="cosmetics-info" className="text-xs font-bold text-theme-text-muted">Kosmetik tidak memberi keunggulan. Tema, paket gambar, dan skin blok dibeli terpisah.</p>
    <div className="flex flex-wrap gap-2">{categories.map(([id,label])=><button key={id} data-testid={`cosmetic-filter-${id}`} aria-pressed={category===id} onClick={()=>setCategory(id)} className={`game-action !p-2 text-[10px] ${category===id?'bg-theme-primary-sky-blue':'bg-theme-surface-card-white'}`}>{label}</button>)}</div>
    {message&&<p data-testid="cosmetic-message" role="status" className="game-panel text-sm font-bold">{message}</p>}
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{items.map(c=>{const owned=profile.ownedCosmetics?.includes(c.id),value=c.category==='avatar'||c.category==='tile'?c.id:c.value,active=profile[COSMETIC_FIELDS[c.category]]===value;
      return <article key={c.id} data-testid={`cosmetic-card-${c.id}`} className="game-panel !p-3 flex flex-col gap-3 min-w-0">
        <CosmeticPreview item={c}/><div data-testid={`cosmetic-description-${c.id}`}><h3 className="font-black text-sm text-theme-text-primary">{c.name}</h3><p className="font-bold text-[10px] text-theme-text-muted mt-1">{c.description}</p></div>
        <button data-testid={`cosmetic-action-${c.id}`} disabled={active||busy} onClick={()=>owned?equip(c):setPending(c)} className={`game-action !p-2 text-xs mt-auto flex items-center justify-center gap-1 ${owned?'bg-theme-primary-tropical-green':'bg-theme-primary-sunny-yellow'}`}>{active?<><Check size={14}/>Dipakai</>:owned?'Pakai':<><Candy size={14}/>{c.price}</>}</button>
      </article>;
    })}</div>
    {!items.length&&<p data-testid="cosmetic-empty" className="game-panel text-center text-sm">Belum ada kosmetik di kategori ini. Koleksi pertamamu menunggu di Toko.</p>}
    {ownedOnly&&<div className="flex flex-wrap gap-2">{['avatar','frame','tiles','tile','block'].map(category=><button key={category} data-testid={`cosmetic-reset-${category}`} onClick={()=>cde.queueMutation('EQUIP_COSMETIC',{itemId:'default',category})} className="game-action text-[10px] bg-theme-surface-card-white">Reset {category}</button>)}</div>}
    <KineticDialog isOpen={!!pending} onClose={()=>setPending(null)} title="Tambah koleksi?" description={pending?`${pending.name} · ${pending.price} permen. Saldo setelah pembelian: ${Math.max(0,cde.permen-pending.price)}.`:''} primaryAction={{label:busy?'Memproses...':'Beli',onClick:buy}} secondaryAction={{label:'Nanti',onClick:()=>setPending(null)}}/>
  </div>;
};