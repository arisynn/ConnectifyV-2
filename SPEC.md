# Block Puzzle Specification

## Core Mechanics
- Grid 10x10. (Configurable BOARD_SIZE, currently 10)
- The player gets 3 pieces to place on the board.
- Clearing a full row or column clears those blocks and adds score.
- Game over if no pieces can be placed.

## Score System
- Base score: 10 points per cell placed.
- Line clear score: (Lines * (Lines + 1) / 2) * 100 points.
- Combo multiplier: Successive placements that result in line clears increase the combo. Bonus score for combos.
- Perfect Clear: +2000 points if the board is completely empty after a clear.

## Obstacle System
Obstacles are placed on the board according to the `LEVEL_CONFIGS` structure and add depth to the block puzzle.

- **Ice**: Breaks after the cell it covers is part of 1 line clear. Ice does *not* block placement; you can place blocks over Ice, but you still need to clear the line to shatter the Ice.
- **Wood / Crate**: Breaks after 1 line clear. Wood *blocks* placement, so you cannot place blocks on it. To clear it, you must fill the rest of the line around the wood.
- **Metal-2 & Metal-1**: Takes 2 line clears to break. Metal *blocks* placement. After 1 line clear, it degrades to Metal-1. After another line clear, it shatters.
- **Stone**: Permanent. Cannot be destroyed by line clears. *Blocks* placement. You just have to work around it.
- **Gem**: Collectible target. Clears after 1 line clear. Does *not* block placement. When destroyed, adds score (or can be tied to a mission objective).

*Note: For block placement obstacles (Wood, Metal, Stone), they count as "filled" cells when evaluating if a line is full.*

## Power-ups
- **Hammer**: Destroy any single cell (1 block).
- **Bomb**: Destroys a 3x3 area.
- **Shuffle**: Refreshes the 3 pieces in the tray.


## Mission & Star System
- Each level (defined in `LEVEL_CONFIGS`) has 3 missions.
- Mission types:
  - `score`: Reach target score.
  - `clear_lines`: Clear target number of rows/columns.
  - `destroy_gems`: Destroy target number of Gems.
  - `destroy_ice`: Destroy target number of Ice.
  - `destroy_wood`: Destroy target number of Wood.
  - `max_moves`: Achieve the main mission within the target number of moves.
- Main Objective: Mission 1. Finishing this wins the level and unlocks the next one (1 Star).
- Bonus Objectives: Mission 2 and 3. Checked upon winning to determine if the player gets 2 or 3 stars.
- Progress for moves, lines cleared, and destroyed obstacles is tracked in real-time.
- Failed level: The player gets a Game Over screen showing failed missions and can retry.

## Gravity Mode
- Gravity Mode is controlled by the `gravity` boolean flag in `LevelConfig`. Defaults to `false`.
- When gravity is ON, blocks and obstacles fall downwards to fill any empty space (like traditional Tetris/Puyo dropping logic) after a line is cleared.
- This drop is calculated per column.
- Cascading logic runs after gravity finishes: if the fallen blocks form new full rows or columns, those are also cleared, adding to the combo multiplier.
- Max cascade limit is 5 iterations to prevent infinite loops.
- All user input (piece placement) is blocked (`isAnimating = true`) for the entire duration of the cascades until the board is completely settled.
- Obstacles (ice, wood, gem, metal, stone) also obey gravity and will drop if they have empty space below them.

## Level Format (Data-Driven)
- Levels are fully data-driven, defined in a single JSON file (`src/game/block-puzzle/core/levels.json`).
- Each level has the following JSON structure:
  - `level`: (number) The level identifier.
  - `gravity`: (boolean) Flag to enable or disable gravity mode (defaults to false).
  - `obstacles`: Array of objects `{ r: number, c: number, type: string }` describing predefined obstacles. Valid types: `ice`, `wood`, `metal-2`, `metal-1`, `stone`, `gem`.
  - `missions`: Array of exactly 3 mission objects `{ type: string, target: number, description: string }`.
    - Main mission is index 0 (completes the level).
    - Bonus missions are index 1 and 2 (determine star rating).
- `getLevelConfig` automatically validates the loaded JSON file. 
  - If a level is invalid (e.g., requires destroying an obstacle that doesn't exist on the map), it safely intercepts the error and outputs a fallback level with an error description instead of crashing the game.

## Telemetry & Logging
- **`level_start`**: Fired when a level is initialized. Payload includes `level` and `retry_count`.
- **`level_end`**: Fired when the game state changes to 'won' or 'gameover' (loss). Payload includes:
  - `level`: The level ID.
  - `result`: 'won' or 'lost'.
  - `stars`: Number of missions completed (0 to 3).
  - `moves`: Total moves used in the session.
  - `score`: Total score achieved.
  - `duration_sec`: Time elapsed since the level started in seconds.
- **`game_over`**: Fired simultaneously with `level_end` when a level is lost. Includes `board_fill_percent` metric (e.g. "84.00" indicating 84% of the board was filled).
- **`placement`**: Fired upon every valid piece placement that triggers the cascade cycle. Tracks `clears` (number of rows/columns cleared directly by this placement, returning values like 0, 1, 2, etc.).
- **`powerup_used`**: Fired when a powerup is actively deployed on the board. Includes `type` ('hammer' or 'bomb') and `moment` (the move index when it was used).

Example Output:
```json
[GAMEPLAY_EVENT] [2026-09-02T12:00:00.000Z] level_start {"level":2,"retry_count":1}
[GAMEPLAY_EVENT] [2026-09-02T12:00:05.000Z] placement {"clears":1}
[GAMEPLAY_EVENT] [2026-09-02T12:00:10.000Z] powerup_used {"type":"hammer","moment":5}
[GAMEPLAY_EVENT] [2026-09-02T12:00:20.000Z] level_end {"level":2,"result":"won","stars":3,"moves":10,"score":1500,"duration_sec":20}
```

## Dynamic Difficulty Adjustment (DDA)
The game uses a smart DDA system to balance challenge without altering the static star thresholds or score formulas.

1. **Skill Tracking (EMA)**:
   - Players have a persistent `skillScore` (0-100).
   - Updated using Exponential Moving Average (EMA) with `alpha = 0.3` after every level attempt.
   - Points are awarded for wins (+50), stars (+10 each), and high clear-per-placement rates (+10). Points are deducted for losses (+10 base win instead of 50), retries (-5 per retry), and poor clear rates (-10).

2. **Pre-Level Bracket Selection**:
   - Skill 0-39: `easy` bracket (removes ~25% of unrequired obstacles, +25% max moves).
   - Skill 40-69: `normal` bracket (no changes to JSON config).
   - Skill 70-100: `hard` bracket (adds up to 2 extra stone obstacles, -15% max moves).
   
3. **Pity System**:
   - If a player fails the same level 3 times consecutively, the next attempt overrides the bracket to `pity`.
   - `pity` bracket: removes ~50% of unrequired obstacles, +50% max moves.
   
4. **Mid-Level Piece Rigging**:
   - If the board becomes dangerously crowded (>60% filled) AND the player is struggling to clear lines (clear rate < 25%), the piece generator enters a "pity rigging" state.
   - During rigging, each generated piece has up to a 30% chance to be explicitly pulled from the pool of pieces that are guaranteed to fit the current board state, preventing immediate auto-gameover frustration.

## Procedural Content Generation (PCG)
- **Activation**: Levels 1-20 are manual tutorial levels (`levels.json`). Levels 21+ are procedurally generated on the fly.
- **Difficulty Budget**:
  - `budget = 15 + floor((level - 20) * 1.5)` (capped at 60 max).
  - Modulated by DDA bracket: `easy` reduces budget by 20%, `hard` increases by 20%, `pity` halves it.
- **Obstacle Prices**: 
  - `wood`: 1, `ice`/`gem`/`stone`: 2, `metal-1`: 3, `metal-2`: 4.
  - Obstacles are randomly placed using a seeded PRNG (`mulberry32`), meaning the same player bracket, level, and attempt count will yield the exact same layout.
- **Mission Templating**:
  - Chapter rotation every 5 levels (e.g. Lvl 21-25 = Lines, 26-30 = Wood, 31-35 = Ice, 36-40 = Gems).
  - Main mission targets scale based on the randomly generated obstacles.
- **Bot Validation**:
  - Every generated level is rapidly simulated by a greedy bot without UI rendering.
  - If the bot fails to solve it within 100 moves, the generator drops the budget by 20% and regenerates.
  - Max 5 retries. If all fail, a static fallback level is served.
  - Star thresholds are baked by the bot: 
    - 3 Stars: Bot's max moves * 1.2
    - 2 Stars: (Derived via logic, though here only max moves and score are required for stars)
    - 1 Star: Bot solved it.
