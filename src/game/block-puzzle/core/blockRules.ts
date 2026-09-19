import type {Piece} from './pieces';
export const canPlaceBlock=(piece:Piece,row:number,col:number,board:string[][],obstacles?:string[][])=>{
  for(let r=0;r<piece.shape.length;r++)for(let c=0;c<piece.shape[r].length;c++)if(piece.shape[r][c]){
    const br=row+r,bc=col+c;
    if(br<0||br>=board.length||bc<0||bc>=board[0].length||board[br][bc]!==''||['wood','metal-2','metal-1','stone'].includes(obstacles?.[br]?.[bc]||''))return false;
  }
  return true;
};
export const hasAnyBlockMove=(board:string[][],tray:(Piece|null)[],obstacles?:string[][])=>tray.some(piece=>piece&&board.some((row,r)=>row.some((_,c)=>canPlaceBlock(piece,r,c,board,obstacles))));