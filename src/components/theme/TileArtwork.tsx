import React from 'react';
import {BASE_TILE_IDS} from '../../core/cosmetics';
export const TileArtwork=({name,pack,className=''}:{name:string,pack:string,className?:string})=>{
  const safePack=pack==='garden'?'garden':'space';
  const safeName=BASE_TILE_IDS.includes(name)?name:BASE_TILE_IDS[0];
  return <img src={`/assets/cosmetics/${safePack}/${safeName}.png`} alt={`${safePack} ${safeName}`} draggable={false} className={`object-contain ${className}`}/>;
};