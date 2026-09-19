const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||0));
export const getAdaptation = (record={}) => {
  const failures=clamp(record.failStreak,0,5), skill=clamp(record.skill ?? 50,0,100);
  const relief=failures>=2 ? Math.min(1,(failures-1)/3) : skill<35 ? .35 : 0;
  const pressure=failures===0&&skill>75 ? (skill-75)/25 : 0;
  return {relief,pressure,label:relief?'Bantuan aktif':pressure?'Performa tinggi':'Seimbang'};
};
export const getOnetDifficulty=(level=1,record={})=>{
  level=Math.max(1,Math.floor(Number(level)||1));const a=getAdaptation(record);
  const baseTime=Math.max(65,140-Math.round(15*Math.log2(level)));
  const baseVariety=Math.min(15,6+Math.floor(Math.sqrt(level-1)*1.7));
  const baseShells=level<3?0:Math.min(6,1+Math.floor((level-3)/6));
  return {level,timeLimit:baseTime+Math.round(a.relief*20-a.pressure*8),
    variety:Math.max(5,baseVariety-Math.floor(a.relief*2)),splitPairs:Math.max(level>=3?1:0,baseShells-Math.floor(a.relief)),
    gateChance:level<7?0:Math.max(0,Math.min(.28,(level-6)*.009)*(1-a.relief*.65)),
    rank:level<6?'Santai':level<16?'Fokus':level<35?'Menantang':'Ahli',adaptation:a.label};
};
export const getTileVarietyCount=(level,maxAvailable)=>Math.min(maxAvailable,getOnetDifficulty(level).variety);
export const getBlockDifficulty=(level=1,record={})=>{
  level=Math.max(1,Math.floor(Number(level)||1));const a=getAdaptation(record);
  const pressure=Math.min(1,Math.log2(level)/6);
  const scoreTarget=Math.round((450+(level-1)*145+Math.pow(level-1,1.12)*15)*(1-a.relief*.18+a.pressure*.08)/50)*50;
  return {level,scoreTarget,pressure:Math.max(0,pressure-a.relief*.2+a.pressure*.08),
    obstacleCount:Math.max(0,Math.min(20,Math.floor((level-1)*.65))-Math.round(a.relief*4)),
    assistChance:Math.max(.05,.35-pressure*.25+a.relief*.2),
    rank:level<6?'Santai':level<16?'Fokus':level<35?'Menantang':'Ahli',adaptation:a.label};
};
export const recordAttempt=(profile,{game,isWinner,progress=0,stars=0,mistakes=0})=>{
  if(!['onet','block'].includes(game))return profile;
  const old=profile.adaptive?.[game]||{};
  const performance=isWinner?Math.min(100,65+clamp(progress,0,100)*.25+clamp(stars,0,3)*5-Math.min(15,mistakes)):20;
  const next={skill:Math.round((old.skill??50)*.75+performance*.25),failStreak:isWinner?0:(old.failStreak||0)+1,
    attempts:(old.attempts||0)+1,winStreak:isWinner?(old.winStreak||0)+1:0,lastResult:isWinner?'won':'lost'};
  return {...profile,adaptive:{...profile.adaptive,[game]:next}};
};