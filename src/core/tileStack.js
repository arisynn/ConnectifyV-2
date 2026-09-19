export const STACK_WIDTH=7.2;
export const STACK_HEIGHT=8.4;
export const TILE_WIDTH=1;
export const TILE_HEIGHT=1.13;
export const tilesOverlap=(a,b)=>Math.min(a.x+TILE_WIDTH,b.x+TILE_WIDTH)-Math.max(a.x,b.x)>.08 && Math.min(a.y+TILE_HEIGHT,b.y+TILE_HEIGHT)-Math.max(a.y,b.y)>.08;
export const exposedTiles=tiles=>tiles.filter(tile=>!tiles.some(cover=>cover.layer>tile.layer&&tilesOverlap(tile,cover)));
export const stackGeometry=(level,version=4)=>{
  const tiles=[];
  const grid=(rows,cols,x,y,layer)=>{for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)tiles.push({id:tiles.length,x:x+c*1.02,y:y+r*1.15,layer});};
  if(level<3&&version>=5){grid(4,6,.55,1.55,0);grid(3,3,level%2?2.08:1.57,2.12,1);grid(1,3,level%2?2.08:1.57,2.70,2);}
  else if(level<3){grid(4,6,.55,1.65,0);grid(2,4,1.58,2.23,1);grid(2,2,2.10,2.80,2);}
  else if(level<8){grid(5,6,.55,1.05,0);grid(4,5,1.06,1.62,1);grid(2,2,2.60,2.20,2);}
  else {grid(6,6,.55,.48,0);grid(5,4,1.58,1.05,1);grid(4,3,2.10,1.62,2);grid(2,2,2.61,2.20,3);}
  return tiles;
};
// Build a valid removal order first, then distribute triples along it.
// Every generated tableau has at least one solution without purchasing help.
export const removalOrder=(tiles,rng)=>{
  const remaining=[...tiles],order=[];
  while(remaining.length){const free=exposedTiles(remaining);const tile=free[Math.floor(rng()*free.length)];order.push(tile.id);remaining.splice(remaining.findIndex(t=>t.id===tile.id),1);}
  return order;
};
export const stackBounds=tiles=>{
  if(!tiles.length)return {x:0,y:0,width:STACK_WIDTH,height:STACK_HEIGHT};
  const x=Math.min(...tiles.map(t=>t.x))-.24,y=Math.min(...tiles.map(t=>t.y))-.18;
  return {x,y,width:Math.max(...tiles.map(t=>t.x+TILE_WIDTH))-x+.24,height:Math.max(...tiles.map(t=>t.y+TILE_HEIGHT))-y+.5};
};
export const solvableStack=(level,kinds,rng,version=4)=>{
  const geometry=stackGeometry(level,version),order=removalOrder(geometry,rng);
  const assignments={};
  for(let i=0;i<order.length;i+=3){const kind=kinds[Math.floor(i/3)%kinds.length];order.slice(i,i+3).forEach(id=>assignments[id]=kind);}
  return geometry.map(tile=>({...tile,kind:assignments[tile.id]}));
};