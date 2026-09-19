import type {LevelConfig,ObstacleType,Mission} from './levelConfig';
import {getBlockDifficulty} from '../../../core/difficulty';
import {seededRandom,shuffleArray} from '../../../core/zen';
export const createAdaptiveBlockLevel=(level:number,record:any={},seed=''):LevelConfig=>{
  const d=getBlockDifficulty(level,record),rng=seededRandom(`block-v4:${level}:${seed}`);
  const cells=[];
  for(let r=0;r<10;r++)for(let c=0;c<10;c++)if(!(r>=3&&r<=6&&c>=3&&c<=6))cells.push({r,c});
  const pool=shuffleArray(cells,rng),obstacles:LevelConfig['obstacles']=[];
  const types:ObstacleType[]=level<7?['gem']:level<12?['gem','ice']:level<22?['gem','ice','wood']:['gem','ice','wood','metal-2'];
  for(const cell of pool){
    if(obstacles.length>=d.obstacleCount)break;
    if(obstacles.filter(o=>o.r===cell.r).length>=3||obstacles.filter(o=>o.c===cell.c).length>=3)continue;
    obstacles.push({...cell,type:types[obstacles.length%types.length]});
  }
  const gems=obstacles.filter(o=>o.type==='gem').length;
  const bonus:Mission=gems?{type:'destroy_gems',target:Math.min(gems,Math.max(1,Math.ceil(gems*.65))),description:`Kumpulkan ${Math.min(gems,Math.max(1,Math.ceil(gems*.65)))} permata`}:{type:'clear_lines',target:Math.max(1,Math.ceil(d.scoreTarget/400)),description:`Bersihkan ${Math.max(1,Math.ceil(d.scoreTarget/400))} baris`};
  const moves=Math.ceil(d.scoreTarget/45)+15;
  return {level,obstacles,gravity:false,missions:[{type:'score',target:d.scoreTarget,description:`Raih ${d.scoreTarget.toLocaleString('id-ID')} skor`},bonus,{type:'max_moves',target:moves,description:`Selesai dalam ${moves} langkah`}]};
};