import React from 'react';
import {motion,AnimatePresence} from 'motion/react';
import {DynamicIcon} from '../../components/theme/DynamicIcon';
import {isZenTileFree} from '../../core/zen';
import {STACK_WIDTH,STACK_HEIGHT,TILE_WIDTH,TILE_HEIGHT} from '../../core/tileStack';
export const TileTableau=({state,onPick}:{state:any,onPick:(id:number)=>void})=>{
  const bounds=state.bounds||{x:0,y:0,width:STACK_WIDTH,height:STACK_HEIGHT};
  return <div data-testid="zen-board" className="trio-tableau" style={{aspectRatio:`${bounds.width}/${bounds.height}`}}>
  <div className="trio-tableau-ring" aria-hidden="true"/>
  <AnimatePresence>
    {state.tiles.map((tile:any)=>{const free=isZenTileFree(state,tile),ready=free&&state.tray.filter((t:any)=>t.kind===tile.kind).length===2;return <motion.button
      key={tile.id} data-testid={`zen-tile-${tile.id}`} data-kind={tile.kind} data-layer={tile.layer} data-exposed={free} disabled={!free||state.status!=='playing'}
      aria-label={`${tile.kind}${free?', terbuka':', tertutup tile lain'}`} onClick={()=>onPick(tile.id)}
      data-match-ready={ready}
      className={`trio-tile ${free?'trio-tile-free':'trio-tile-blocked'} ${ready?'trio-tile-ready':''}`}
      style={{left:`${(tile.x-bounds.x)/bounds.width*100}%`,top:`${(tile.y-bounds.y)/bounds.height*100}%`,width:`${TILE_WIDTH/bounds.width*100}%`,height:`${TILE_HEIGHT/bounds.height*100}%`,zIndex:tile.layer*20+10}}
      initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:.6,y:45}} transition={{duration:.22,delay:0}}
      whileTap={free?{scale:.93}:undefined} whileHover={free?{y:-3}:undefined}>
      <DynamicIcon name={tile.kind} type="tiles" className="w-full h-full pointer-events-none"/>
      {!free&&<span className="trio-blocked-shade" aria-hidden="true"/>}
    </motion.button>})}
  </AnimatePresence>
  <span data-testid="trio-layer-count" className="trio-layer-note">{state.tiles.length?Math.max(...state.tiles.map((t:any)=>t.layer))+1:0} lapis · {state.tiles.length} tile</span>
</div>;
};