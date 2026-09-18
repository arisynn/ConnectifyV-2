// ===================== DIFFICULTY CURVE =====================
// Timer speed stays constant across all levels (see game/timer.js) — difficulty instead
// ramps through board variety so players never lose purely to a shrinking clock.
// Cycles every 30 levels: 10 easy, 10 medium, 10 hard, then eases off again — this keeps
// Fewer unique tile types = more duplicates on the board = easier to spot matches.
// More unique types = harder to find pairs, even though the board size never changes.

export const getTileVarietyCount = (level, maxAvailable) => {
    // Berdasarkan feedback, kita hapus sistem pooling yang melelahkan.
    // Tetapkan 12 tile secara konstan agar pemain mengandalkan sistem tema 
    // untuk visual yang baru, dan kreator tema tidak kelelahan membuat banyak asset.
    return Math.max(4, Math.min(maxAvailable, 12));
};
