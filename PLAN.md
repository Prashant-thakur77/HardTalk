# PLAN

Live plan for HardTalk. Rewritten from SCORECARD.md at the end of every round, not from the
previous plan. Every item names the criterion it moves (CLAUDE.md §3).

**Round 5 score: 12/20** (C1 2 · C2 4 · C3 3 · C4 3), down from 13. The round-5 safety rewrite let
explicit disclosures through ("I'm going to kill myself on Friday.") because each carve-out looked
only at the next word (D-050), and broke "Stop it." (D-051). C4 lost its point for it.

**Hard ceiling, stated honestly:** C1 and C3 are capped here at "code complete, tested, bundled";
the four P0s close only with one recorded session on a phone with keys. Totals: 6, 9, 12, 13, 12.
The loop has converged on what this machine can verify.

## Now (round 6)

1. **Distress detection that cannot regress by construction** [C4] — D-050, D-052. Patterns are
   unconditional; idioms are whole phrases removed before matching, so an idiom can only cancel
   its own words. Every probe line from rounds 3 to 5, plus the builder's own, is a test in both
   directions. Expected: C4 back to 4. Effort: low.
2. **"Stop it." stops again** [C4] — D-051: "it"/"this" count only straight after "stop", so
   "Can we pause it?" and "I need this to stop." stay roleplay. Effort: low.
3. **No false sentences** [C1] [C2] — D-053 (timestamped eval files; excluded gradings named in
   EVALS.md), D-054 (the ask line never claims "no request" when the grader just had no quote;
   mock typed mode says plainly that changed lines score lower there). Effort: low.

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
