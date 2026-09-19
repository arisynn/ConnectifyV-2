# Connectify V2 — gameplay & controlled economy update

## Original user problem statement
Aku mau kamu perbarui game web ku ini, jangan ubah tampilan nya, ui ux untuk mobile web sudah bagus, kmu boleh ngatur untuk versi dekstop nya, tolong perbaiki gameplay onet, tiles nya, tiles yang lebih dari 1 itu nggak 1 tiles, kan grid nya lebar 6 panjang 10 ya, nah berarti kalau tiles nya 2×1 berarti ngambil 2 tiles gitu digabung jdi bukan single tiles dibaca nya, terus kalau pecah summon tiles 1×1, perbaiki aja biar lebih bagus gameplay nya, untuk animasi nya itu udh bagus tapi untuk tiles yang lebih dri satu klo gasalah belum ditambahin animasi nya, invoice nya aku mau sehari jangan lebih dari 100 permen pendapatan pemain, untuk hadiah nya sesuaikan aja biar lebih kecil, jadi mengurangi resiko inflasi, terus tambahkan juga fitur untuk pengeluaran. Pemasukan permen sama pengeluaran jangan seimbang. Pengeluaran harus punya harga yang cukup mahal, jadi terasa progress nya, terus aku pengen pemasukan cuma dari peti, achievement, dan misi, biar gampang di kontrol nya. Perbaiki sistem ekonomi nya ya. Nah terakhir, tantangan itu sebenernya bukan cuma onet, tapi aku pengen ada mini game nya, match 3 mirip zen match, apa aja deh yang pas dan memakai gambar tiles. Nah sekarang kosmetik, tambahkan avatar, tema, jenis tiles, klo bisa gambar tiles dijual terpisah, tambahin dark mode ya, bingkai avatar, nah update juga fitur multiplayer nya biar makin bagus, untuk tampilan mobile perbagus aja, oh iya untuk peti itu cara dapetin nya perbarui juga sm hadiah nya atur juga biar ga terlalu banyak. Udh itu saja deh, kamu boleh menambahkan sesuatu yang menurutmu bagus, jangan terlalu fokus pada prompt ku, kamu juga harus ngasih saran dan nambahin biar game nya makin bagus dan siap untuk di publish!

Clarifications: Existing project, fallback repository https://github.com/arisynn/ConnectifyV-2.git. Combined cap 100/player/day, individual rewards roughly 1–10. Both live code-room duels and asynchronous friend score challenges. Minigame items and Block Puzzle skins sold for currency sinks. Preserve mobile startup/lobby; menu and level-select changes allowed. Add tile resources.

## Architecture decisions
- Retained existing React 19/Vite/TypeScript, Tailwind 4, motion/react, Express and Supabase CDE. No stack migration.
- Existing theme/art assets and mobile startup/lobby retained; desktop constrained stage and revamped game menu/level map.
- Pure shared rules for economy, purchases, Onet and Zen imported by client/server. Supabase CDE RPC revision-based writes and idempotency enforce balances/cap atomically. API profile updates allowlist excludes economic stats, ownership and reward claims.
- WIB (Asia/Jakarta) date boundaries; spending never restores daily earning allowance. Existing balances preserved. Completed unclaimed missions survive period rollovers.
- Live duels + async challenges stored in `cde_game_rooms` with CAS revisions and TTL. New SQL migration restricts direct browser currency writes/RPC access.
- Preview runner: root Express/Vite on 3000 via existing supervisor frontend command; FastAPI bridge on 8001 only forwards /api. `.env` contains explicit preview flag. Existing no-key preview mode now persists to gitignored `.preview-game-data.json`; production backend refuses preview fallback. Real Supabase keys absent.

## Implemented
- Onet: explicit coordinates/spans, true two-cell footprints, slave resolution, balanced 1x1 spawn after shell pair, rectangular ring animation, guarded match interactions, deadlock recovery.
- Rewards: no win/login/duel permen. Daily missions 2/4/6; weekly 6/8/10; achievements 2–10; chest common 1–3, rare 4–6, epic 7–10. Cap 100 daily. Ledger income/spending and wallet UI.
- Chests: 12 progress points per chest, max 3 acquired/day, deterministic rolls per chest ID, cap-safe opening, speedup costs at least 15. Most free boosters removed.
- Sinks: hint35/shuffle45/hammer60/bomb90/Zen undo40/rescue75; cosmetics150–650; themes450/600/750. Duplicate ownership/purchases checked server-side.
- Zen Match: 7-slot triple tray, increasing variety, layered 54-tile levels, shuffle/undo/reserve assistance, save/resume, progression/missions/chests. Daily challenges rotate Onet and Zen.
- Cosmetic shop/collection: two original SVG avatars, two frames, two separate tile-art packs, single golden crab tile, two block skins. Shared tile renderer and skins apply during gameplay. Dark mode persisted.
- Multiplayer: authenticated membership, server-generated common Onet board, validated moves, readiness countdown, revisions, reconnect grace, room restore/copy/rematch; verified once-only finish progression. Block duel shared piece seed and local resume. No wagering currency.
- Asynchronous Zen challenges: code sharing, 24h expiration, common seed, move replay validation, server timed score, one final score/account and leaderboard.

## Verification status
- User paused initial testing and clarified: "Sebelum pengujian mungkin kamu sedikit salah paham, aku pengen asets gambar nya beneran pakai gambar bukan svg, dan untuk minigame lain nya sebenarnya bukan harus namanya zen match, dan tampilan nya menurutku jelek, match 3 nggak seperti itu tampilan tiles nya, kalo gasalah tiles nya numpuk, boleh tolong update lagi, untuk game onet dan game block puzzle tolong perbaiki sistem level engine nya biar difficult nya adaptif semakin level tinggi semakin sulit, perbaiki gameplay nya, tambahkan block puzzle yang bukan misi yang infinity loh kalah kalau board nya penuh. Gas lanjutkan"
- Refinement implemented: 35 original generated PNG sprites (30 tile art, gold crab,2 frames,2 block textures),2 WebP avatars; old SVG cosmetics removed. Sources/provenance in asset-sources/manifest.json; preparation script in scripts/prepare-raster-assets.py.
- Renamed visible minigame to Tile Trio. True geometric overlaps,3–4 layers,blocked input,depth shadows,7-slot rack. Topological generation ensures a free solvable route.36/54/72 tiles by level. Existing SKU IDs preserved.
- Replaced constant Onet variety12/time90 with adaptive difficulty: rising variety6–15,shell pairs0–6,directional gates up to28%, time140→65 at baseline; bounded retry relief and skill pressure; parameters fixed during run. Loss history persisted through RECORD_ATTEMPT.
- Block mission levels now deterministic bounded obstacle layouts with central opening,monotonically rising score targets,appropriate objective counts,and skill/failure relief. Weighted piece pool gradually increases complex shapes.
- Added Block Infinity via gameMode=endless: no missions/timer/win threshold,10x10 original board preserved,gameover when no remaining piece fits,save/resume,separate high score,normal lines/combo and optional paid boosters. Does not increment mission levels or directly mint candy. Also added tap/keyboard placement alongside existing drag.
- `yarn lint` and `yarn build` passed before final tests.
- Screenshot smoke: original startup, new menu, Zen Match loaded through real UI registration.
- Comprehensive testing agent requested; append results and fixes before handoff.

## Prioritized backlog / next tasks
- P0: Test all flows, fix issues, capture mobile/dark mode and two-client verification.
- P0 external setup: provide actual Supabase URL/anon/server secret and apply migrations including `202609190001_game_rooms.sql`; verify against real Supabase. Current verification uses preview backend/auth, not live service.
- P1: Stronger solo/Block Puzzle server-side move replay anti-cheat; current live Onet and async Zen are replay-validated, live Block score remains client-reported and casual.
- P1: Long-session economic telemetry (earn/spend/source/item) for tuning retention vs scarcity; archive ledger beyond last100 and scheduled expired-room cleanup.
- P2: Seasonal cosmetic collections, tutorial cues and more minigames using the shared tile artwork.

## Current limitations
- Latest user narrowed scope: "Eh nggak deng multiplayer ga apa apa, perbarui gameplay tile trio saja biar makin bagus sm tiles tumpuk nya juga" and requested no broad testing due credit concern. No further multiplayer changes.
- Targeted Tile Trio polish: compact fixed bounds so tiles render larger without moving as the pile clears; new 36-tile cascade layout for newly created solo/daily boards (v5). Existing saves kept; friend challenge generator default v4 unchanged.
- Stable tray grouping (new matches join their group instead of re-sorting the whole rack); gold outline for exposed finishing tiles; match feedback and near-full rack advice.
- Replaced arbitrary shuffle with a topological, tray-aware rearrangement preserving tile counts. If shuffle cannot help or reserve is occupied, show reason and do not consume an item. Serialized item interactions and atomic tap state avoid stale undo/rescue and rapid-tap races.
- Verification limited to type compilation and small pure-rule checks for this final refinement; no broad testing suite or testing-agent run requested/performed yet.
- No real production Supabase integration test until credentials/migration are supplied. Do not claim publication-ready.
- Current browser account auth fallback is preview-only and is not a production identity system.
- No payments/LLM/new paid service integrations were added.