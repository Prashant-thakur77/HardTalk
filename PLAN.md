# PLAN

Live plan for HardTalk. Rewritten from SCORECARD.md at the end of every round, not from the
previous plan. Every item names the criterion it moves (CLAUDE.md §3).

**Round 1 score: 6/20** (C1 1 · C2 2 · C3 1 · C4 2). Biggest loss: C1 — no real voice or
grader, so evidence quotes and the retry delta are canned (D-002, D-003, D-004).

**Hard ceiling to state honestly:** this build machine has no Android SDK, no device and no
provider keys. C1 and C3 cannot be *verified* past "code complete + tested" until the owner
runs a dev build on a phone with real ElevenLabs / Anthropic / RevenueCat keys. Every round
keeps that path one command away and logs what still needs a device.

## Now (round 2)

Ranked by points recoverable ÷ effort.

1. **Land the grader and the rubric data (Phases 1 + 2)** [C1] [C4] — closes D-003 (live path),
   D-012, D-018, D-010 (grading half), D-017 (server glob).
   Anchored rubrics citing SBI / NVC / Crucial Conversations; persona goal, hidden objection,
   L1–L3 behaviour and stop condition as data; `/server` grades with Claude, re-requests once
   on invented quotes, then downgrades; mock grades pass through the same evidence gate.
   Expected: C4 +1, C1 +0.5, C2 +0.5. Effort: low (built and green in the working tree).
2. **Judge's first 60 seconds** [C2] — closes D-005, D-006, D-007, D-011.
   README (demo GIF, one-line mock start, architecture, 3-command setup), MIT LICENSE,
   `pnpm dev` that opens in Expo Go or a browser without a dev build, `.env.example`, and a
   CLAUDE.md that matches the tree. Expected: C2 +1.5. Effort: low.
3. **Real voice (Phase 3)** [C1] — closes D-002 in code; device run stays owner-side.
   ElevenLabs provider behind `VoiceProvider`, `/voice/token` minting, persona prompt from
   data, turn limit, interruption corrections, error surfacing instead of a white screen
   (rest of D-010). Expected: C1 +1 (unverified until a device run). Effort: medium.

## Next

4. **RevenueCat (Phase 4)** [C3] — D-001, D-020. `pro` entitlement, paywall only at the 4th
   attempt or "Create custom scenario", scenario-aware copy via paywall custom variables,
   Restore, attempts persisted locally so history exists (D-009).
5. **Honest mock + persistence** [C1] [C2] — D-004 (label replays as recordings, not scores),
   D-008 (per-level mock or say it plays one level), D-014 (status copy), D-009, D-019.
6. **Accessibility + text-only mode (Phase 5)** [C4] — D-016, ACCESSIBILITY.md.
7. **Safety (Phase 6)** [C4] — D-013, SAFETY.md, stop word, distress exit.
8. **Evals (Phase 7)** [C2] [C4] — `pnpm eval`, EVALS.md with the numbers that can be run here.
9. **Polish** — D-015 (mock scripts: smaller deltas, personas that concede less cleanly),
   D-017 remainder (stock icon).

## Rejected

- **Canned "smart" offline grader for mock mode** — a heuristic that scores typed text would be
  a second, weaker grader to maintain and would still not make the mock "real". Mock stays a
  clearly labelled replay; realness comes from the live path. (Serves nothing in C1–C4.)
- **Moving the paywall off the 4th attempt** (D-020 suggestion) — the frozen product says 3
  graded sessions free. Keep the boundary, and make the paywall earn it: it opens on the
  scenario just practised and the score it moved.
- **A web build as a product** — the browser is only the judge's zero-install preview of mock
  mode. No web-specific features, no deploy.
