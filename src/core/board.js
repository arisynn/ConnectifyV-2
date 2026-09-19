import { ROWS, COLS } from "./config.js";
import { getOnetDifficulty } from "./difficulty.js";
import { BASE_TILE_IDS } from './cosmetics.js';
export const tileCells = (r, c, tile) => tile?.isSplit
    ? tile.splitOrientation === 'horizontal' ? [{r,c}, {r,c:c+1}] : [{r,c}, {r:r+1,c}]
    : [{r,c}];
export const resolveTile = (board, r, c) => board[r]?.[c]?.isSlave ? {r:board[r][c].masterR, c:board[r][c].masterC} : {r,c};
export const breakMatchedTiles = (board, a, b) => {
    const next = board.map(row => [...row]);
    const t1 = board[a.r][a.c], t2 = board[b.r][b.c];
    if (!t1 || !t2 || t1.id !== t2.id || !!t1.isSplit !== !!t2.isSplit) return next;
    const cells = [...tileCells(a.r,a.c,t1), ...tileCells(b.r,b.c,t2)];
    // Same image stays in balanced pairs; split shells never destroy unrelated cells.
    cells.forEach(({r,c}) => { next[r][c] = t1.isSplit ? {id:t1.id, openSide:null, spawned:true} : 0; });
    return next;
};

// --- PATHFINDING ---

export const getPath = (board, r1, c1, r2, c2, ignoredTiles = []) => {
    ({r:r1,c:c1} = resolveTile(board,r1,c1));
    ({r:r2,c:c2} = resolveTile(board,r2,c2));
    const t1 = board[r1]?.[c1];
    const t2 = board[r2]?.[c2];
    
    if (!t1 || !t2) return null;
    if (!!t1.isSplit !== !!t2.isSplit) return null;
    if (t1.isSlave || t2.isSlave) return null; // Logic should only be called on master coordinates
    if (t1.id !== t2.id) return null;
    if (r1 === r2 && c1 === c2) return null;

    const getCells = (r, c, t) => {
        const cells = [{r, c, dir: t.openSide}];
        if (t.isSplit) {
            if (t.splitOrientation === 'horizontal') cells.push({r, c: c+1, dir: t.openSide});
            else cells.push({r: r+1, c, dir: t.openSide});
        }
        return cells;
    };
    
    const cells1 = getCells(r1, c1, t1);
    const cells2 = getCells(r2, c2, t2);
    const allowed = [...cells1, ...cells2];
    
    const isClear = (r, c) => {
        if (!board[r] || c < 0 || c >= board[r].length) return false;
        if (board[r][c] === 0) return true;
        if (allowed.some(a => a.r === r && a.c === c)) return true;
        if (ignoredTiles.some(ign => ign.r === r && ign.c === c)) return true;
        const t = board[r][c];
        if (t.isSlave && ignoredTiles.some(ign => ign.r === t.masterR && ign.c === t.masterC)) return true;
        return false;
    };
    
    const isPathClear = (r_1, c_1, r_2, c_2) => {
        if (r_1 === r_2) {
            const min = Math.min(c_1, c_2); const max = Math.max(c_1, c_2);
            for (let i = min + 1; i < max; i++) if (!isClear(r_1, i)) return false;
        } else if (c_1 === c_2) {
            const min = Math.min(r_1, r_2); const max = Math.max(r_1, r_2);
            for (let i = min + 1; i < max; i++) if (!isClear(i, c_1)) return false;
        }
        return true;
    };

    let hasDirectionMismatch = false;
    
    const validatePath = (path, startCell, endCell) => {
        const p0 = path[0], p1 = path[1];
        const dr1 = p1.r - p0.r, dc1 = p1.c - p0.c;
        const dir1 = dr1 < 0 ? 'up' : dr1 > 0 ? 'down' : dc1 < 0 ? 'left' : 'right';
        if (startCell.dir && startCell.dir !== dir1) return false;
        
        const len = path.length;
        const pL = path[len-1], pL1 = path[len-2];
        const dr2 = pL.r - pL1.r, dc2 = pL.c - pL1.c;
        const dir2 = dr2 > 0 ? 'up' : dr2 < 0 ? 'down' : dc2 > 0 ? 'left' : 'right';
        if (endCell.dir && endCell.dir !== dir2) return false;
        
        return true;
    };

    for (const s of cells1) {
        for (const e of cells2) {
            const tryPath = (path) => {
                path = path.filter((p, i) => !i || p.r !== path[i-1].r || p.c !== path[i-1].c);
                if (validatePath(path, s, e)) return path;
                hasDirectionMismatch = true;
                return null;
            };

            // 0 Turns
            if ((s.r === e.r || s.c === e.c) && isPathClear(s.r, s.c, e.r, e.c)) {
                let p = tryPath([{r: s.r, c: s.c}, {r: e.r, c: e.c}]); if (p) return {path: p};
            }
            // 1 Turn
            if (isClear(s.r, e.c) && isPathClear(s.r, s.c, s.r, e.c) && isPathClear(s.r, e.c, e.r, e.c)) {
                let p = tryPath([{r: s.r, c: s.c}, {r: s.r, c: e.c}, {r: e.r, c: e.c}]); if (p) return {path: p};
            }
            if (isClear(e.r, s.c) && isPathClear(s.r, s.c, e.r, s.c) && isPathClear(e.r, s.c, e.r, e.c)) {
                let p = tryPath([{r: s.r, c: s.c}, {r: e.r, c: s.c}, {r: e.r, c: e.c}]); if (p) return {path: p};
            }
            // 2 Turns Horiz
            for (let dir of [1, -1]) {
                let c = s.c + dir;
                while (c >= 0 && c < COLS + 2 && isClear(s.r, c)) {
                    if (isClear(e.r, c) && isPathClear(s.r, c, e.r, c) && isPathClear(e.r, c, e.r, e.c)) {
                        let p = tryPath([{r: s.r, c: s.c}, {r: s.r, c}, {r: e.r, c}, {r: e.r, c: e.c}]); if (p) return {path: p};
                    }
                    c += dir;
                }
            }
            // 2 Turns Vert
            for (let dir of [1, -1]) {
                let r = s.r + dir;
                while (r >= 0 && r < ROWS + 2 && isClear(r, s.c)) {
                    if (isClear(r, e.c) && isPathClear(r, s.c, r, e.c) && isPathClear(r, e.c, e.r, e.c)) {
                        let p = tryPath([{r: s.r, c: s.c}, {r, c: s.c}, {r, c: e.c}, {r: e.r, c: e.c}]); if (p) return {path: p};
                    }
                    r += dir;
                }
            }
        }
    }
    
    if (hasDirectionMismatch) return { error: 'DIRECTION_MISMATCH' };
    return { error: 'NO_PATH' }; 
};

export const findHint = (board) => {
    for (let i = 1; i <= ROWS; i++) {
        for (let j = 1; j <= COLS; j++) {
            const t1 = board[i][j];
            if (t1 !== 0 && !t1.isSlave) {
                for (let k = 1; k <= ROWS; k++) {
                    for (let l = 1; l <= COLS; l++) {
                        const t2 = board[k][l];
                        if ((i !== k || j !== l) && t2 !== 0 && !t2.isSlave && t1.id === t2.id) {
                            const result = getPath(board, i, j, k, l);
                            if (result && result.path) return {p1: {r: i, c: j}, p2: {r: k, c: l}, path: result.path};
                        }
                    }
                }
            }
        }
    }
    return null;
};

export const countRemaining = (b) => { let count = 0; if (b) for (let r = 1; r <= ROWS; r++) for (let c = 1; c <= COLS; c++) if (b[r][c] !== 0) count++; return count; };

// --- SMART BOARD GENERATION ---

// We keep placeTilesSmartly simpler now since split tiles pre-occupy spots
export const placeTilesSmartly = (tiles, currentBoard = null, positions = null) => {
    const newBoard = currentBoard ? [...currentBoard.map(row => [...row])] : Array.from({ length: ROWS + 2 }, () => Array(COLS + 2).fill(0));
    const posList = positions || [];
    if (!positions) {
        for (let r = 1; r <= ROWS; r++) for (let c = 1; c <= COLS; c++) posList.push({r, c});
    }

    for (let attempt = 0; attempt < 50; attempt++) {
        let currentTiles = [...tiles].sort(() => Math.random() - 0.5);
        let boardTemp = [...newBoard.map(row => [...row])];

        for (let i = 0; i < posList.length; i++) {
            const { r, c } = posList[i];
            if (boardTemp[r][c] !== 0) continue; // Skip if already filled (e.g. split tiles)

            let selectedIdx = -1;
            for (let tIdx = 0; tIdx < currentTiles.length; tIdx++) {
                const tile = currentTiles[tIdx];
                let sameNeighbors = 0;
                
                if (r > 1 && boardTemp[r-1][c] !== 0 && boardTemp[r-1][c].id === tile.id) sameNeighbors++;
                if (c > 1 && boardTemp[r][c-1] !== 0 && boardTemp[r][c-1].id === tile.id) sameNeighbors++;
                if (r > 1 && c > 1 && boardTemp[r-1][c-1] !== 0 && boardTemp[r-1][c-1].id === tile.id) sameNeighbors++;
                if (r > 1 && c < COLS && boardTemp[r-1][c+1] !== 0 && boardTemp[r-1][c+1].id === tile.id) sameNeighbors++;
                
                let countInRow = 0;
                for (let tc = 1; tc < c; tc++) if (boardTemp[r][tc] !== 0 && boardTemp[r][tc].id === tile.id) countInRow++;
                let countInCol = 0;
                for (let tr = 1; tr < r; tr++) if (boardTemp[tr][c] !== 0 && boardTemp[tr][c].id === tile.id) countInCol++;

                if (sameNeighbors === 0 && countInRow < 3 && countInCol < 3) {
                    selectedIdx = tIdx;
                    break;
                }
            }

            if (selectedIdx === -1) selectedIdx = 0;
            boardTemp[r][c] = currentTiles.splice(selectedIdx, 1)[0];
        }

        if (findHint(boardTemp)) return boardTemp;
    }

    // Fallback
    let fallbackTiles = [...tiles].sort(() => Math.random() - 0.5);
    let fallbackIdx = 0;
    for (let i = 0; i < posList.length; i++) {
        if (newBoard[posList[i].r][posList[i].c] === 0) {
            newBoard[posList[i].r][posList[i].c] = fallbackTiles[fallbackIdx++];
        }
    }
    
    // Force solvable fallback - clear openSide on the first identical pair we find
    const emptyPos = posList.filter(p => !newBoard[p.r][p.c].isSplit && !newBoard[p.r][p.c].isSlave);
    if (emptyPos.length >= 2) {
       for (let i = 0; i < emptyPos.length; i++) {
           for (let j = i + 1; j < emptyPos.length; j++) {
               const p1 = emptyPos[i], p2 = emptyPos[j];
               if (newBoard[p1.r][p1.c].id === newBoard[p2.r][p2.c].id) {
                   newBoard[p1.r][p1.c].openSide = null;
                   newBoard[p2.r][p2.c].openSide = null;
                   if (findHint(newBoard)) return newBoard;
               }
           }
       }
    }

    return newBoard;
};

export const generateBoard = (themeKey, level, settings = getOnetDifficulty(level)) => {
    const fullThemeData = BASE_TILE_IDS;
    
    const varietyCount = Math.min(settings.variety,fullThemeData.length);
    const themeData = [...fullThemeData].sort(() => Math.random() - 0.5).slice(0, Math.max(1, varietyCount));
    
    let selectedIds = []; 
    const requiredPairs = (ROWS * COLS) / 4;
    while (selectedIds.length < requiredPairs) selectedIds.push(...[...themeData].sort(() => Math.random() - 0.5));
    selectedIds = selectedIds.slice(0, requiredPairs);
    
    const numSplitPairs = settings.splitPairs;
    
    const splitIds = selectedIds.splice(0, numSplitPairs);
    const normalIds = selectedIds;
    
    let initialBoard = Array.from({ length: ROWS + 2 }, () => Array(COLS + 2).fill(0));
    
    const placeSplitTile = (id) => {
        const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        for (let attempts = 0; attempts < 200; attempts++) {
            let r = Math.floor(Math.random() * ROWS) + 1;
            let c = Math.floor(Math.random() * COLS) + 1;
            if (orientation === 'horizontal' && c < COLS && initialBoard[r][c] === 0 && initialBoard[r][c+1] === 0) {
                const openSide = Math.random() < settings.gateChance ? ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] : null;
                initialBoard[r][c] = { id, isSplit: true, splitOrientation: 'horizontal', openSide };
                initialBoard[r][c+1] = { isSlave: true, masterR: r, masterC: c, id };
                return true;
            }
            if (orientation === 'vertical' && r < ROWS && initialBoard[r][c] === 0 && initialBoard[r+1][c] === 0) {
                const openSide = Math.random() < settings.gateChance ? ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] : null;
                initialBoard[r][c] = { id, isSplit: true, splitOrientation: 'vertical', openSide };
                initialBoard[r+1][c] = { isSlave: true, masterR: r, masterC: c, id };
                return true;
            }
        }
        return false;
    };

    // We must place 2 of each splitId so they match
    splitIds.forEach(id => {
        const snapshot = initialBoard.map(row => [...row]);
        if (!placeSplitTile(id) || !placeSplitTile(id)) { initialBoard = snapshot; normalIds.push(id); }
    });

    let normalTiles = []; 
    normalIds.forEach(id => {
        const makeTile = () => {
           let openSide = null;
           if (Math.random() < settings.gateChance) {
               const sides = ['up', 'down', 'left', 'right'];
               openSide = sides[Math.floor(Math.random() * sides.length)];
           }
           return { id, openSide };
        };
        normalTiles.push(makeTile(), makeTile(), makeTile(), makeTile());
    }); 
    
    // The positions that are still empty will be filled
    let emptyPos = [];
    for (let r = 1; r <= ROWS; r++) {
        for (let c = 1; c <= COLS; c++) {
            if (initialBoard[r][c] === 0) emptyPos.push({r, c});
        }
    }
    
    return placeTilesSmartly(normalTiles, initialBoard, emptyPos);
};

export const guaranteedShuffle = (currentBoard) => {
    let boardCopy = currentBoard.map(row => [...row]);
    let tiles = []; let pos = [];
    
    // We only shuffle normal tiles, keeping split tiles in place to avoid breaking layout logic
    for (let r = 1; r <= ROWS; r++) {
        for (let c = 1; c <= COLS; c++) {
            if (boardCopy[r][c] !== 0 && !boardCopy[r][c].isSplit && !boardCopy[r][c].isSlave) {
                tiles.push(boardCopy[r][c]);
                pos.push({r, c});
                boardCopy[r][c] = 0; // Clear them for placeTilesSmartly
            }
        }
    }
    const shuffled = tiles.length ? placeTilesSmartly(tiles, boardCopy, pos) : boardCopy;
    if (findHint(shuffled)) return shuffled;
    // Deadlock recovery: release directional gates, including large shells.
    for (let r=1;r<=ROWS;r++) for(let c=1;c<=COLS;c++) if (shuffled[r][c] && !shuffled[r][c].isSlave) shuffled[r][c] = {...shuffled[r][c], openSide:null};
    if (findHint(shuffled)) return shuffled;
    // Last resort: rebuild as adjacent pairs while preserving every occupied cell.
    // Split shells become four singles of the same icon, so parity is conserved.
    const ids = [];
    for(let r=1;r<=ROWS;r++) for(let c=1;c<=COLS;c++) if(shuffled[r][c]) ids.push(shuffled[r][c].id);
    ids.sort();
    const rebuilt = Array.from({length:ROWS+2}, () => Array(COLS+2).fill(0));
    ids.forEach((id,i) => { rebuilt[1+Math.floor(i/COLS)][1+i%COLS] = {id,openSide:null,spawned:true}; });
    return rebuilt;
};
