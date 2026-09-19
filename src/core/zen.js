import { BASE_TILE_IDS } from './cosmetics.js';
import {solvableStack,tilesOverlap,removalOrder,stackBounds} from './tileStack.js';
export const seededRandom = seed => { let h=2166136261; for(const ch of String(seed)) h=Math.imul(h^ch.charCodeAt(0),16777619); return () => { h+=0x6D2B79F5; let t=Math.imul(h^h>>>15,1|h); t^=t+Math.imul(t^t>>>7,61|t); return ((t^t>>>14)>>>0)/4294967296; }; };
export const shuffleArray = (array, rng=Math.random) => { const a=[...array]; for(let i=a.length-1;i>0;i--) {const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; };
export const createZenGame = (seed, level=1, version=4) => {
  const rng=seededRandom(seed), variety=Math.min(9,4+Math.floor(level/2));
  const kinds=shuffleArray(BASE_TILE_IDS,rng).slice(0,variety);
  const tiles=solvableStack(level,kinds,rng,version);
  return { version, tiles, bounds:stackBounds(tiles), total:tiles.length, tray:[], reserve:[], score:0, triples:0, status:'playing', seed, level, moves:[],lastMatch:null };
};
export const isZenTileFree = (state,tile) => !state.tiles.some(t=>t.layer>tile.layer&&tilesOverlap(t,tile));
export const pickZenTile = (state,id,fromReserve=false) => {
  if(state.status!=='playing') return state;
  const tile=(fromReserve?state.reserve:state.tiles).find(t=>t.id===id);
  if(!tile || (!fromReserve && !isZenTileFree(state,tile))) return state;
  let tray=[...state.tray];
  const lastSame=tray.reduce((last,t,i)=>t.kind===tile.kind?i:last,-1);
  tray.splice(lastSame<0?tray.length:lastSame+1,0,tile);
  const match=tray.filter(t=>t.kind===tile.kind).length===3;
  if(match) tray=tray.filter(t=>t.kind!==tile.kind);
  const next={...state,tiles:fromReserve?state.tiles:state.tiles.filter(t=>t.id!==id),reserve:fromReserve?state.reserve.filter(t=>t.id!==id):state.reserve,tray,
    score:state.score+(match?100:0),triples:state.triples+(match?1:0),moves:[...(state.moves||[]),id],lastMatch:match?{kind:tile.kind,serial:state.triples+1}:null};
  next.status=!next.tiles.length&&!next.tray.length&&!next.reserve.length?'won':tray.length>=7?'lost':'playing';
  return next;
};
export const rescueZen = state => state.tray.length && !state.reserve.length ? {...state,reserve:state.tray.slice(0,3),tray:state.tray.slice(3),status:'playing'} : state;

// Rearrange only board images, retaining all tiles and the current tray.
// Completing tray pairs first avoids charging for a shuffle that cannot help.
export const shuffleZen=(state,rng=Math.random)=>{
  if(state.status!=='playing'||state.tiles.length<2)return {error:'Acak hanya saat papan masih bisa dimainkan.'};
  if(state.reserve.length)return {error:'Kosongkan Simpanan dahulu sebelum mengacak papan.'};
  const counts={},held={};state.tiles.forEach(t=>counts[t.kind]=(counts[t.kind]||0)+1);state.tray.forEach(t=>held[t.kind]=(held[t.kind]||0)+1);
  const sequence=[];let occupied=state.tray.length;
  for(const [kind,count] of Object.entries(held).sort((a,b)=>b[1]-a[1])){
    const needed=3-count;
    if(occupied+needed>7||(counts[kind]||0)<needed)return {error:'Acak tidak bisa menyelamatkan baki ini. Gunakan Batal atau Simpan 3; item acak tidak dipakai.'};
    sequence.push(...Array(needed).fill(kind));counts[kind]-=needed;occupied-=count;
  }
  for(const kind of shuffleArray(Object.keys(counts),rng)){
    if(counts[kind]%3)return {error:'Susunan belum dapat diacak. Item tidak dipakai.'};
    sequence.push(...Array(counts[kind]).fill(kind));
  }
  const order=removalOrder(state.tiles,rng),assignment={};order.forEach((id,i)=>assignment[id]=sequence[i]);
  return {state:{...state,tiles:state.tiles.map(t=>({...t,kind:assignment[t.id]})),lastMatch:null},error:null};
};