# PLAN

Live plan for HardTalk. Rewritten from SCORECARD.md at the end of every round, not from the
previous plan. Every item names the criterion it moves (CLAUDE.md §3).

**Round 3 score: 12/20** (C1 2 · C2 4 · C3 2 · C4 4), up from 9. Biggest loss: C3 — the
purchase has never run on a device (D-001), and the paywall that shot would film has the wrong
copy (D-033) behind a free tier that resets in two taps (D-032).

**Hard ceiling, stated honestly:** no Android SDK, device or provider keys here. The three P0s
still open (D-001 purchase, D-002/D-003 live voice and grading, D-004 real retry delta) close
only with one recorded session on a phone. C1 and C3 cannot pass 3 from this machine; the loop
will converge below the exit condition on those two, and the final packet will say so.

## Now (round 4)

1. **Paywall correctness** [C3] — D-032, D-033, D-034, D-035. Free sessions counted by a
   counter that deleting history does not reset; one remote paywall whose headline and body are
   custom variables filled from `data/paywall.yaml`, so each entry point gets its own copy and
   the mock paywall is the same text; copy names the scenario being started; purchase and
   restore failures shown; mock Pro survives reload and Restore finds it.
   Expected: C3 2 → 3. Effort: low.
2. **Stops that always stop, and a distress filter that does not cry wolf** [C4] [C1] —
   D-036, D-037, D-038. Distinctive persona stop line matched exactly, and the app hangs up
   itself when it hears it; tighter distress patterns with the reviewer's false positives as
   tests; "No, stop." stops; the stopped screen links to support; README data claims corrected.
   Expected: C4 holds 4 with fewer ways to lose it; C1 +0.5. Effort: low.
3. **Scorecard and brief that do not contradict themselves** [C4] [C1] — D-039 (level cards show
   a user-facing summary; the persona-only behaviour stays in the prompt), D-040 (the ask line
   agrees with the Ask made score). Effort: low.

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
