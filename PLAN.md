# PLAN

Live plan for HardTalk. Rewritten from SCORECARD.md at the end of every round, not from the
previous plan. Every item names the criterion it moves (CLAUDE.md §3).

**Round 8 score: 12/20** (C1 2 · C2 4 · C3 3 · C4 3), flat for the fourth round: 13, 12, 12, 12, 12.
Converged. The round-7 fix narrowed tier 1 to cut false alarms and lost 28 disclosures (D-066):
the fifth safety regression, each from hand-picked tests that never covered a harmful subject
swapped into an idiom.

## Now (round 9, hand-over)

1. **Make the safety list regression-proof, not just fixed** [C4] — D-066: tier 1 restored and
   declared grow-only (false alarms become tests marked accepted, never narrower patterns);
   idioms limited to clause-initial requests or harmless subjects/objects; 420 generated tests
   put a person in front of every idiom and require distress. D-067: a stop needs only lead-ins
   and short trailers around it, so "Can we pause, and look at…" is pushback. D-068: SAFETY.md
   says plainly that most idioms pause. D-069: a late flag also refunds the free session.
2. **Final review, then the final packet** — no further polishing rounds: C1 and C3 are blocked
   on the owner's phone session, and C4's remaining risk is what a word list cannot do, which the
   server-side model check exists for.

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
