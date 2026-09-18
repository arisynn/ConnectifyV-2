# Connectify – PRD / Progress Log

## Original problem statement
"Bangun aplikasi mobile: selesaikan pembuatan game ku menjadi lebih bagus, currency nya tetap satu, tambahin semua yang sudah ada di frontend."
User clarifications: backend already uses Supabase (do not replace), login already exists, don't change the design, finish the "in development" screens, gameplay systems may be improved.

## Architecture (unchanged stack)
- Frontend: Vite + React + Tailwind + motion (mobile-first PWA), `/app/src`
- API: Express (`/app/server.ts`, `/app/api/cde.ts`, `/app/api/multiplayer.ts`) → Supabase (`cde_profiles`, `cde_accounts`, RPC `cde_mutate_state`)
- Shared pure game logic (client optimistic + server authoritative): `/app/src/core/*.js`
- Preview env: no Supabase keys → in-memory mock (`api/supabase.ts`, `src/lib/supabase.ts`). `.env` `API_PORT=8001` exposes /api on the port the preview ingress expects. `/app/frontend/package.json` is only a launcher shim for the preview supervisor.
- Real Supabase: set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY` in `/app/.env` (see `.env.example`).

## Single currency
Permen is the only currency. Legacy `coins` fields are stripped server-side; `profile.coins` mirrors `permen` client-side.

## Implemented (2026-06)
- Misi screen: daily (5) + weekly (5) missions, progress bars, reset countdowns, claim → permen. Weekly meta-missions (complete_daily / complete_daily_all) fed by daily claims.
- Pencapaian screen: 14 achievements × tiers, category filters, claim (validated server-side), reward chips.
- Collection screen: avatars, themes (equip persisted to profile), badges, inventory, chest types.
- Tantangan Harian: seeded daily Onet level (5–20), 75s timer, +500 permen once/day.
- Permen reward on every win (Onet + Block Puzzle) via `calcWinPermen`; win modals show permen/chest pts/daily bonus.
- Block Puzzle now feeds PROCESS_WIN (stats, chests, missions, achievements); power-ups consumed via USE_ITEM (server authoritative, hammers/bombs now protected fields).
- Chest: permen rewards + items (hammer/bomb), speed-up with permen (SPEED_UP_CHEST), next-chest progress, ready badge in lobby.
- Shop: shared prices (`economy.js`) for client & server; hammer/bomb purchasable; theme prices 1000/1500; owned count badges.
- Economy rebalanced: missions 300/600/1000 (daily), 2000/3500/5000 (weekly); achievements 200→5000 per tier; chests 150–2500.
- Bug fixes: achievements never paid out `permen`; server rejected hammer/bomb purchase; price mismatch client/server; missing `checkAchievements` export; `weeklyMissions` sanitized away (now `activeWeeklyMissions`); Statistik screen was unreachable (now via Profile); lobby badges for claimable missions/achievements.

## Backlog
- P1: Verify against real Supabase project (RPC fallback paths) once keys are provided.
- P1: Notifications screen deep-link to Misi/Pencapaian when tapping a mission notification.
- P2: Leaderboard (weekly permen earned), more avatars/themes for Collection.
- P2: Sound/haptic polish for claims.
