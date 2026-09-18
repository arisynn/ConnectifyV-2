import { LevelConfig, Mission, ObstacleType } from './levelConfig';
import { ALL_PIECES, Piece } from './pieces';
import { DDABracket } from './dda';

// Seeded RNG
function xmur3(str: string) {
    for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    } return function() {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

const OBSTACLE_PRICES: Record<string, number> = {
    'wood': 1,
    'ice': 2,
    'gem': 2,
    'stone': 2,
    'metal-1': 3,
    'metal-2': 4
};

function getRandomInt(rng: () => number, min: number, max: number) {
    return Math.floor(rng() * (max - min + 1)) + min;
}

// Bot Simulation
function botCanPlace(piece: Piece, row: number, col: number, board: string[][], obstacles: string[][]): boolean {
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c] === 1) {
                const br = row + r;
                const bc = col + c;
                if (br < 0 || br >= 10 || bc < 0 || bc >= 10) return false;
                if (board[br][bc] !== '') return false;
                if (obstacles[br][bc] === 'stone' || obstacles[br][bc] === 'metal-2') return false;
            }
        }
    }
    return true;
}

function simulateBot(config: LevelConfig, seed: number): { success: boolean, moves: number, score: number, lines: number } {
    const rng = mulberry32(seed);
    const board = Array(10).fill(0).map(() => Array(10).fill(''));
    const obstacles = Array(10).fill(0).map(() => Array(10).fill(''));
    config.obstacles.forEach(o => obstacles[o.r][o.c] = o.type);

    let score = 0;
    let linesClearedTotal = 0;
    let mainProgress = 0;
    const mainTarget = config.missions[0].target;
    const mainType = config.missions[0].type;
    
    let currentPieceOptions = [
        ALL_PIECES[getRandomInt(rng, 0, ALL_PIECES.length - 1)],
        ALL_PIECES[getRandomInt(rng, 0, ALL_PIECES.length - 1)],
        ALL_PIECES[getRandomInt(rng, 0, ALL_PIECES.length - 1)]
    ];

    for (let moves = 1; moves <= 150; moves++) {
        let bestVal = -999999;
        let bestPlacement = null;
        let bestPieceIdx = -1;

        // Try all available pieces
        for (let pIdx = 0; pIdx < currentPieceOptions.length; pIdx++) {
            const piece = currentPieceOptions[pIdx];
            if (!piece) continue;

            for (let r = 0; r < 10; r++) {
                for (let c = 0; c < 10; c++) {
                    if (botCanPlace(piece, r, c, board, obstacles)) {
                        // Simulate placement
                        let lines = 0;
                        let targetHits = 0;
                        let newFilled = 0;

                        const simB = board.map(row => [...row]);
                        const simO = obstacles.map(row => [...row]);

                        for (let pr = 0; pr < piece.shape.length; pr++) {
                            for (let pc = 0; pc < piece.shape[pr].length; pc++) {
                                if (piece.shape[pr][pc] === 1) {
                                    simB[r + pr][c + pc] = piece.colorClass;
                                    newFilled++;
                                }
                            }
                        }

                        // Check clears
                        const rowsToClear: number[] = [];
                        const colsToClear: number[] = [];
                        for (let i = 0; i < 10; i++) {
                            if (simB[i].every(cell => cell !== '') && simO[i].every(obs => obs !== 'stone' && obs !== 'metal-2')) rowsToClear.push(i);
                            if (simB.every(row => row[i] !== '') && simO.every(row => row[i] !== 'stone' && row[i] !== 'metal-2')) colsToClear.push(i);
                        }

                        lines = rowsToClear.length + colsToClear.length;
                        
                        const cellsToClear: {r: number, c: number}[] = [];
                        rowsToClear.forEach(row => { for (let col = 0; col < 10; col++) cellsToClear.push({r: row, c: col}); });
                        colsToClear.forEach(col => { for (let row = 0; row < 10; row++) if (!cellsToClear.some(cell => cell.r === row && cell.c === col)) cellsToClear.push({r: row, c: col}); });

                        cellsToClear.forEach(cell => {
                            const obs = simO[cell.r][cell.c];
                            if (mainType === 'destroy_ice' && obs === 'ice') targetHits++;
                            if (mainType === 'destroy_wood' && obs === 'wood') targetHits++;
                            if (mainType === 'destroy_gems' && obs === 'gem') targetHits++;
                        });

                        if (mainType === 'clear_lines') targetHits = lines;
                        
                        // Value heuristic: completing mission is top priority
                        let val = (targetHits * 5000) + (lines * 1000) + (newFilled * 10);
                        
                        // Penalty for tall/crowded board (very simplistic)
                        let heightPenalty = 0;
                        for(let i=0; i<10; i++) {
                           for(let j=0; j<10; j++) {
                               if (simB[i][j] !== '') heightPenalty++;
                           }
                        }
                        val -= heightPenalty * 5; // Stronger penalty to keep board flat

                        if (val > bestVal) {
                            bestVal = val;
                            bestPlacement = { r, c, piece, simB, simO, targetHits, lines };
                            bestPieceIdx = pIdx;
                        }
                    }
                }
            }
        }

        if (!bestPlacement) {
            return { success: false, moves, score, lines: linesClearedTotal }; // Game over
        }

        // Apply best placement
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                board[r][c] = bestPlacement.simB[r][c];
            }
        }
        
        // Execute clears on real obstacles array for bot tracking
        if (bestPlacement.lines > 0) {
            linesClearedTotal += bestPlacement.lines;
            score += ((bestPlacement.lines * (bestPlacement.lines + 1)) / 2) * 100;
            
            // clear cells
            const rowsToClear: number[] = [];
            const colsToClear: number[] = [];
            for (let i = 0; i < 10; i++) {
                if (board[i].every(cell => cell !== '') && obstacles[i].every(obs => obs !== 'stone' && obs !== 'metal-2')) rowsToClear.push(i);
                if (board.every(row => row[i] !== '') && obstacles.every(row => row[i] !== 'stone' && row[i] !== 'metal-2')) colsToClear.push(i);
            }
            const cellsToClear: {r: number, c: number}[] = [];
            rowsToClear.forEach(row => { for (let col = 0; col < 10; col++) cellsToClear.push({r: row, c: col}); });
            colsToClear.forEach(col => { for (let row = 0; row < 10; row++) if (!cellsToClear.some(cell => cell.r === row && cell.c === col)) cellsToClear.push({r: row, c: col}); });

            cellsToClear.forEach(cell => {
                const obs = obstacles[cell.r][cell.c];
                if (obs === 'ice') obstacles[cell.r][cell.c] = '';
                if (obs === 'wood') obstacles[cell.r][cell.c] = '';
                if (obs === 'gem') obstacles[cell.r][cell.c] = '';
                if (obs === 'metal-1') obstacles[cell.r][cell.c] = '';
                if (obs === 'metal-2') obstacles[cell.r][cell.c] = 'metal-1';
                
                if (obs !== 'stone' && obs !== 'metal-2') board[cell.r][cell.c] = '';
            });
        }

        mainProgress += bestPlacement.targetHits;
        score += 50;

        currentPieceOptions[bestPieceIdx] = null as any;
        if (currentPieceOptions.every(p => !p)) {
             currentPieceOptions = [
                ALL_PIECES[getRandomInt(rng, 0, ALL_PIECES.length - 1)],
                ALL_PIECES[getRandomInt(rng, 0, ALL_PIECES.length - 1)],
                ALL_PIECES[getRandomInt(rng, 0, ALL_PIECES.length - 1)]
            ];
        }

        if (mainType === 'score') {
             if (score >= mainTarget) return { success: true, moves, score, lines: linesClearedTotal };
        } else {
             if (mainProgress >= mainTarget) return { success: true, moves, score, lines: linesClearedTotal };
        }
    }

    return { success: false, moves: 150, score, lines: linesClearedTotal };
}

export function generateProceduralLevel(level: number, bracket: DDABracket, seedStr: string): LevelConfig {
    const cacheKey = `pcg_level_${level}_${bracket}_${seedStr}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try { return JSON.parse(cached); } catch(e) {}
    }

    let baseBudget = 15 + Math.floor((level - 20) * 1.5);
    if (baseBudget > 60) baseBudget = 60; // Cap budget
    
    if (bracket === 'easy') baseBudget = Math.floor(baseBudget * 0.8);
    if (bracket === 'hard') baseBudget = Math.floor(baseBudget * 1.2);
    if (bracket === 'pity') baseBudget = Math.floor(baseBudget * 0.5);

    let attempts = 0;
    let currentBudget = baseBudget;
    
    // Core Seed
    const seedNum = xmur3(seedStr)();

    while (attempts < 5) {
        const rng = mulberry32(seedNum + attempts);
        const config: LevelConfig = {
            level,
            obstacles: [],
            gravity: level % 3 === 0, // Gravity every 3 levels
            missions: [] as any
        };

        const chapter = Math.floor((level - 21) / 5) % 4;
        let mainType: Mission['type'] = 'clear_lines';
        let mainObsType: string | null = null;
        
        if (chapter === 0) mainType = 'clear_lines';
        else if (chapter === 1) { mainType = 'destroy_wood'; mainObsType = 'wood'; }
        else if (chapter === 2) { mainType = 'destroy_ice'; mainObsType = 'ice'; }
        else if (chapter === 3) { mainType = 'destroy_gems'; mainObsType = 'gem'; }

        // Place Main Obstacles
        let budgetLeft = currentBudget;
        let targetCount = 0;

        if (mainObsType) {
            const price = OBSTACLE_PRICES[mainObsType];
            const maxToPlace = Math.min(15, Math.floor((budgetLeft * 0.6) / price));
            const toPlace = getRandomInt(rng, Math.max(3, Math.floor(maxToPlace/2)), maxToPlace);
            
            for (let i = 0; i < toPlace; i++) {
                let r = getRandomInt(rng, 1, 8);
                let c = getRandomInt(rng, 1, 8);
                if (!config.obstacles.some(o => o.r === r && o.c === c)) {
                    config.obstacles.push({ r, c, type: mainObsType as any });
                    budgetLeft -= price;
                    targetCount++;
                }
            }
        } else {
            targetCount = Math.min(10, getRandomInt(rng, 2 + Math.floor(level/15), 4 + Math.floor(level/10)));
        }

        // Fill remaining budget with random obstacles
        const obsTypes = ['wood', 'ice', 'stone', 'gem', 'metal-1'];
        if (level > 35) obsTypes.push('metal-2');
        
        let watchdog = 100;
        let maxRandomObs = Math.floor(currentBudget * 0.5);
        while (budgetLeft > currentBudget - maxRandomObs && watchdog > 0) {
            watchdog--;
            const type = obsTypes[getRandomInt(rng, 0, obsTypes.length - 1)];
            const price = OBSTACLE_PRICES[type];
            if (price <= budgetLeft) {
                let r = getRandomInt(rng, 0, 9);
                let c = getRandomInt(rng, 0, 9);
                if (!config.obstacles.some(o => o.r === r && o.c === c)) {
                    config.obstacles.push({ r, c, type: type as any });
                    budgetLeft -= price;
                }
            }
        }

        // Set Main Mission
        config.missions[0] = {
            type: mainType,
            target: mainType === 'clear_lines' ? targetCount : Math.max(1, Math.floor(targetCount * 0.8)),
            description: mainType === 'clear_lines' ? `Hancurkan ${targetCount} baris` : `Kumpulkan ${Math.max(1, Math.floor(targetCount * 0.8))} ${mainObsType}`
        };

        // Add temporary padding for simulation
        config.missions[1] = { type: 'score', target: 999999, description: '...' };
        config.missions[2] = { type: 'max_moves', target: 999, description: '...' };

        // SIMULATE
        const botResult = simulateBot(config, seedNum + attempts * 99);

        if (botResult.success) {
            // Setup thresholds based on Bot
            const m = botResult.moves;
            // Mission 1: Score (Secondary) -> Set to bot score * 0.7
            const expectedScore = Math.floor(botResult.score * 0.7 / 100) * 100;
            config.missions[1] = {
                type: 'score',
                target: Math.max(500, expectedScore),
                description: `Capai skor ${Math.max(500, expectedScore)}`
            };

            // Mission 2: Max Moves
            // 1 star = main (bot solvable)
            // 2 stars = main + score
            // 3 stars = main + score + max moves (~ bot moves + 10%)
            const moveTarget = Math.ceil(m * 1.2);
            config.missions[2] = {
                type: 'max_moves',
                target: moveTarget,
                description: `Selesai dlm max ${moveTarget} langkah`
            };

            // Overwrite description of main
            if (mainType === 'destroy_ice') config.missions[0].description = `Hancurkan ${config.missions[0].target} Es`;
            else if (mainType === 'destroy_wood') config.missions[0].description = `Hancurkan ${config.missions[0].target} Kayu`;
            else if (mainType === 'destroy_gems') config.missions[0].description = `Kumpulkan ${config.missions[0].target} Permata`;
            
            localStorage.setItem(cacheKey, JSON.stringify(config));
            return config;
        }

        // Failed -> Lower budget and retry
        currentBudget = Math.floor(currentBudget * 0.8);
        attempts++;
    }

    // Failsafe level if simulation absolutely fails 5 times
    const fallback: LevelConfig = {
        level,
        gravity: false,
        obstacles: [],
        missions: [
            { type: 'score', target: 1000, description: 'Capai skor 1000' },
            { type: 'clear_lines', target: 3, description: 'Hancurkan 3 baris/kolom' },
            { type: 'max_moves', target: 50, description: 'Selesai dlm max 50 langkah' }
        ]
    };
    return fallback;
}

// Attach simulator to window for debugging
if (typeof window !== "undefined") (window as any).runPCGSimulation = () => {
    console.log("Starting PCG Simulation (Levels 21 - 40)...");
    const profiles = ['badai', 'jago'];
    
    profiles.forEach(profile => {
        console.log(`\n=== Simulating Profile: ${profile} ===`);
        let currentSkill = profile === 'jago' ? 80 : 30;
        
        for (let l = 21; l <= 40; l++) {
            let bracket: DDABracket = 'normal';
            if (currentSkill < 40) bracket = 'easy';
            if (currentSkill > 70) bracket = 'hard';
            
            const config = generateProceduralLevel(l, bracket, `seed_${profile}_${l}`);
            const mainTarget = config.missions[0].description;
            const moveBudget = config.missions[2].target;
            
            console.log(`[Lvl ${l} | ${bracket.toUpperCase()} | Skill ${currentSkill}] Obs: ${config.obstacles.length} | Main: ${mainTarget} | Moves: ${moveBudget}`);
            
            // Simulate progression
            if (profile === 'jago') {
                currentSkill = Math.min(100, currentSkill + 5);
            } else {
                currentSkill = Math.max(0, currentSkill - 2);
            }
        }
    });
    console.log("\nSimulation Complete.");
};
