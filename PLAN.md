# PLAN

Live plan for HardTalk. Rewritten from SCORECARD.md at the end of every round, not from the
previous plan. Every item names the criterion it moves (CLAUDE.md §3).

**Round 11 score: 12/20** (C1 2 · C2 4 · C3 3 · C4 3), flat for the seventh round. 150993c was the
first safety fix that lost nothing in either direction; every round-11 finding is an addition, not
a regression. Deadline day: the reviewer is explicit that further safety rounds will not move the
score. Only the owner-side session in Next can.

## Now (round 12)

1. **Round 11 additions** [C4] [C3] — D-079 (stabbing, burning, tried/threatened to, future-tense
   threats, plans with a time, bridges, floors, bottles of pills, stockpiling, "I can't go on"),
   D-080 (would/will you stop, I said/told you to stop, make it stop, "stop this is too much",
   "pause im scared"), D-081 (the "beat me to it" exception holds in reported speech; the other
   workplace lines are listed as accepted false positives), D-082 (the plan picker drives the
   purchase button), D-078 (the last hardcoded stop words moved to data).

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
