export type BlockShape = number[][];

export interface Piece {
  id: number | string;
  shape: BlockShape;
  colorClass: string;
}

export const BLOCK_COLORS = [
  'bg-blue-400',
  'bg-theme-primary-coral-pink',
  'bg-green-400',
  'bg-yellow-400',
  'bg-purple-400',
  'bg-orange-400',
  'bg-teal-400',
  'bg-rose-400',
];

interface ShapeDef {
  shapeId: string;
  shape: BlockShape;
  baseWeight: number;
  isLarge: boolean;
}

const SHAPES: ShapeDef[] = [
  // 1x1 (Always safe, very common)
  { shapeId: '1x1', shape: [[1]], baseWeight: 100, isLarge: false },
  // 1x2, 2x1
  { shapeId: '1x2', shape: [[1, 1]], baseWeight: 80, isLarge: false },
  { shapeId: '2x1', shape: [[1], [1]], baseWeight: 80, isLarge: false },
  // 1x3, 3x1
  { shapeId: '1x3', shape: [[1, 1, 1]], baseWeight: 60, isLarge: false },
  { shapeId: '3x1', shape: [[1], [1], [1]], baseWeight: 60, isLarge: false },
  // 1x4, 4x1 (Large)
  { shapeId: '1x4', shape: [[1, 1, 1, 1]], baseWeight: 40, isLarge: true },
  { shapeId: '4x1', shape: [[1], [1], [1], [1]], baseWeight: 40, isLarge: true },
  // 1x5, 5x1 (Large)
  { shapeId: '1x5', shape: [[1, 1, 1, 1, 1]], baseWeight: 20, isLarge: true },
  { shapeId: '5x1', shape: [[1], [1], [1], [1], [1]], baseWeight: 20, isLarge: true },
  // 2x2
  { shapeId: '2x2', shape: [[1, 1], [1, 1]], baseWeight: 70, isLarge: false },
  // 3x3 box (Large)
  { shapeId: '3x3', shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], baseWeight: 15, isLarge: true },
  // L shape (small)
  { shapeId: 'L2-1', shape: [[1, 0], [1, 1]], baseWeight: 60, isLarge: false },
  { shapeId: 'L2-2', shape: [[0, 1], [1, 1]], baseWeight: 60, isLarge: false },
  { shapeId: 'L2-3', shape: [[1, 1], [1, 0]], baseWeight: 60, isLarge: false },
  { shapeId: 'L2-4', shape: [[1, 1], [0, 1]], baseWeight: 60, isLarge: false },
  // L shape (big) (Large)
  { shapeId: 'L3-1', shape: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], baseWeight: 30, isLarge: true },
  { shapeId: 'L3-2', shape: [[0, 0, 1], [0, 0, 1], [1, 1, 1]], baseWeight: 30, isLarge: true },
  { shapeId: 'L3-3', shape: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], baseWeight: 30, isLarge: true },
  { shapeId: 'L3-4', shape: [[1, 1, 1], [0, 0, 1], [0, 0, 1]], baseWeight: 30, isLarge: true },
  // T shape
  { shapeId: 'T3-1', shape: [[1, 1, 1], [0, 1, 0], [0, 1, 0]], baseWeight: 40, isLarge: true },
  { shapeId: 'T3-2', shape: [[0, 1, 0], [0, 1, 0], [1, 1, 1]], baseWeight: 40, isLarge: true },
  { shapeId: 'T3-3', shape: [[1, 0, 0], [1, 1, 1], [1, 0, 0]], baseWeight: 40, isLarge: true },
  { shapeId: 'T3-4', shape: [[0, 0, 1], [1, 1, 1], [0, 0, 1]], baseWeight: 40, isLarge: true },
  // Plus shape
  { shapeId: 'Plus', shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], baseWeight: 30, isLarge: true },
  // U shape
  { shapeId: 'U-1', shape: [[1, 0, 1], [1, 1, 1]], baseWeight: 30, isLarge: true },
  { shapeId: 'U-2', shape: [[1, 1], [1, 0], [1, 1]], baseWeight: 30, isLarge: true },
  { shapeId: 'U-3', shape: [[1, 1, 1], [1, 0, 1]], baseWeight: 30, isLarge: true },
  { shapeId: 'U-4', shape: [[1, 1], [0, 1], [1, 1]], baseWeight: 30, isLarge: true },
];


const getShapeId = (shape: BlockShape): string => {
  const match = SHAPES.find(s => JSON.stringify(s.shape) === JSON.stringify(shape));
  return match ? match.shapeId : '';
};
let nextPieceId = 1;


export const ALL_PIECES: Piece[] = SHAPES.flatMap(shapeDef => {
    return BLOCK_COLORS.map(color => {
        const p: Piece = {
            id: `${shapeDef.shapeId}-${color}`,
            shape: shapeDef.shape,
            colorClass: color
        };
        return p;
    });
});

export const getRandomPieces = (
  count: number,
  board: string[][] | null = null,
  canPlaceFn: ((piece: Piece, row: number, col: number, b: string[][], obs?: any) => boolean) | null = null,
  rigChance: number = 0,
  obstacles: any = null
): Piece[] => {
  const pieces: Piece[] = [];
  const generatedIds: Record<string, number> = {};

  // Calculate board fullness if board is provided
  let isBoardCrowded = false;
  if (board) {
    let filled = 0;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (board[r][c] !== '') filled++;
      }
    }
    if (filled > 40) isBoardCrowded = true;
  }

  for (let i = 0; i < count; i++) {
    let piece: Piece | null = null;
    let attempts = 0;

    // Rig chance for DDA
    if (rigChance > 0 && Math.random() < rigChance && board && canPlaceFn) {
        const validPieces = ALL_PIECES.filter(p => {
            for(let r=0; r<board.length; r++) {
                for(let c=0; c<board[0].length; c++) {
                    if(canPlaceFn(p, r, c, board, obstacles)) return true;
                }
            }
            return false;
        });
        if (validPieces.length > 0) {
            piece = validPieces[Math.floor(Math.random() * validPieces.length)];
        }
    } else if (board && canPlaceFn && Math.random() < 0.2) {
      // Original 20% safe-piece fallback logic
      const validPieces = ALL_PIECES.filter(p => {
        for(let r=0; r<board.length; r++) {
            for(let c=0; c<board[0].length; c++) {
                if(canPlaceFn(p, r, c, board, obstacles)) return true;
            }
        }
        return false;
      });
      if (validPieces.length > 0) {
          piece = validPieces[Math.floor(Math.random() * validPieces.length)];
      }
    }

    // Standard weighted selection
    while (!piece && attempts < 10) {
      const candidates = ALL_PIECES.filter(p => {
        const def = SHAPES.find(s => s.shapeId === getShapeId(p.shape));
        if (!def) return false;
        if (isBoardCrowded && def.isLarge && Math.random() < 0.7) return false;
        if (generatedIds[def.shapeId] >= 1) return false;
        return true;
      });

      const pool = candidates.length > 0 ? candidates : ALL_PIECES;
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      const def = SHAPES.find(s => s.shapeId === getShapeId(candidate.shape));

      if (def) {
        generatedIds[def.shapeId] = (generatedIds[def.shapeId] || 0) + 1;
      }
      piece = candidate;
      attempts++;
    }

    if (!piece) {
      piece = ALL_PIECES[Math.floor(Math.random() * ALL_PIECES.length)];
    }
    pieces.push(piece);
  }

  return pieces;
};
