# PLAN

Live plan for HardTalk. Rewritten from SCORECARD.md at the end of every round, not from the
previous plan. Every item names the criterion it moves (CLAUDE.md §3).

**Round 11 score: 12/20** (C1 2 · C2 4 · C3 3 · C4 3), flat for the seventh round. 150993c was the
first safety fix that lost nothing in either direction; every round-11 finding is an addition, not
a regression. Deadline day: the reviewer is explicit that further safety rounds will not move the
score. Only the owner-side session in Next can.

## Now (round 12): practice tracks, panels and faces

Owner decision, 2026-09-29: widen HardTalk from three workplace conversations to four
**practice tracks**, each graded on its own framework-cited rubrics. Built data-first, so a
judge can read every track, rubric and persona without reading code.

1. **Tracks** [C4] — `data/tracks/*.yaml`: Workplace (the original three), Pitch Q&A,
   Interview and Debate. A track names the setting the persona is in, what the grader is
   grading, its four rubrics and its "key line" (your ask, your close, your result, your claim).
   Every track has four rubrics, so every score is still out of 16 and the retry delta and the
   paywall copy stay comparable.
2. **Nine new rubrics** [C4] — anchored 1–4, each citing a named framework: Pyramid Principle
   (answer first), Made to Stick (evidence), LAER (objections), STAR (structured stories),
   Kolb (ownership), Toulmin (claim, rebuttal, held position) and Rapoport's rules (steelman).
3. **Panels** [C1] [C4] — a scenario can seat up to two more people with their own stance: one
   who agrees with you, one who keeps questioning. Captions say who spoke. Live mode voices
   them through ElevenLabs multi-voice tags; mock mode replays them.
4. **Faces** [C1] — every persona gets a drawn face (data in the scenario YAML, SVG in code, no
   image assets or network). It blinks, talks while speaking, and its expression follows the
   difficulty level and your final score. Reduce Motion stills it. Decorative to screen readers.
5. **Three new scenarios with mock replays** [C1] — a seed-round Q&A with two investors, a
   first-job interview panel, and a debate with a moderator. Mock mode stays complete for all six.
6. **Custom scenarios pick a track** [C3] — Pro users can write a pitch, interview or debate of
   their own, graded on that track's rubrics.
7. **Generic grading** [C2] — the grade is keyed by the track's rubrics; the model's output schema
   is built per track, so a missing or extra dimension is a schema error and gets the one retry.
   Saved attempts from before the change still load.

Acceptance: `pnpm test`, `pnpm lint`, `pnpm typecheck` clean; browser e2e runs a scenario in every
track with zero page errors; a hostile review finds no P0.

## Next

4. **Owner-side, on a phone** [C1] [C3] — create the GitHub remote (D-006); dev build; one
   uncut L2 take; one Test Store purchase and one Restore after reinstall; `pnpm eval` with a key
   and paste the table into EVALS.md; two or three real testers for a quote. This is what closes
   D-001..D-004 and lifts C1 and C3.
5. **Polish** — D-015 (mock deltas), D-029 (word-level live captions via audio alignment).

## Rejected

- **Canned "smart" offline grader for mock mode** — a second, weaker grader that would still not
  make mock "real". Mock stays a labelled replay.
- **Moving the paywall off the 4th attempt** (D-020) — the frozen product gives three graded
  sessions. The paywall names the scenario and the score move instead.
- **Server-side quota and entitlement checks** (rest of D-032) — needs accounts or receipt
  validation on /server, which the scope freeze rules out. The on-device counter survives
  history deletion; a reinstall still resets it, and the README says so.
- **Auth on /server** — any secret shipped in the app is public; the rate limit bounds cost.
- **A web build as a product** — the browser is only the zero-install preview of mock mode.
