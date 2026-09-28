# PLAN

Live plan for HardTalk. Rewritten from SCORECARD.md at the end of every round, not from the
previous plan. Every item names the criterion it moves (CLAUDE.md §3).

**Round 2 score: 9/20** (C1 2 · C2 3 · C3 1 · C4 3), up from 6. Biggest loss: C3 — HEAD has no
RevenueCat at all (D-001), on the criterion that defines this competition.

**Hard ceiling, stated honestly:** no Android SDK, no device and no provider keys on this
machine. C1 and C3 can reach "code complete, tested, bundled for Android" here; "filmed on a
phone" needs the owner. Every round keeps that path one command away.

## Now (round 3)

1. **RevenueCat, committed** [C3] — D-001, D-009, D-019, D-020 copy. `pro` entitlement on the
   Test Store; paywall only at the 4th graded session and "Create your own scenario"; copy names
   the scenario just practised and its score move (custom variables); live flip via the
   customer-info listener; Restore; custom scenarios and progress history behind `pro`;
   attempts persisted. Expected: C3 1 → 3, C1 +0.5. Effort: low (built, 11 tests, e2e green).
2. **Safety that actually holds, and text-only mode** [C4] [C1] — D-013, D-022, D-023, D-024,
   D-028, D-016. Stop word and distress exit that are never graded (client, and server
   refuses to score); support screen; disclaimer; delete-history; no leaked call when stopping
   while connecting; honest audio-retention copy; typed mode with the same persona and grader;
   screen-reader announcements with the persona muted; haptics; reduce motion; 3:1 control
   boundaries. SAFETY.md + ACCESSIBILITY.md. Expected: C4 3 → 4. Effort: medium (mostly built).
3. **Cheap C2/C4 correctness** [C2] [C4] — D-021 (`pnpm run server`), D-025 (schema retry
   reachable), D-026 (word-boundary evidence), D-027 (mock ask grade matches its anchor),
   D-030 (rate limit + text caps), D-031 (grader request text into data).
   Expected: C2 3 → 4. Effort: low.

## Next

4. **Evals (Phase 7)** [C2] [C4] — `pnpm eval`, gold set, EVALS.md with the numbers that can be
   computed here and an honest "needs a key" for the rest; CLAUDE.md paths all real (D-011).
5. **Polish** [C1] [C2] — D-015 (smaller, earned mock deltas), D-017 (real app icon, also the
   Devpost asset), D-029 (persona captions revealed with audio alignment).
6. **Owner-side, on a phone** [C1] [C3] — create the GitHub remote (D-006), run the dev build,
   one Test Store purchase, one uncut L2 take. Tracked here so it is never forgotten.

## Rejected

- **Canned "smart" offline grader for mock mode** — a second, weaker grader to maintain that
  would still not make mock "real". Mock stays a labelled replay.
- **Moving the paywall off the 4th attempt** (D-020) — the frozen product gives three graded
  sessions. The paywall earns its placement instead: it names the scenario and the score move.
- **Auth on /server** (part of D-030) — any secret shipped in the app is public. A per-IP rate
  limit and request caps bound the cost instead; the README says it is a dev server.
- **A web build as a product** — the browser is only the zero-install preview of mock mode.
