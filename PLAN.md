# PLAN

Live plan for HardTalk. Rewritten from SCORECARD.md at the end of every round, not from the
previous plan. Every item names the criterion it moves (CLAUDE.md §3).

**Round 9 score: 12/20** (C1 2 · C2 4 · C3 3 · C4 3), flat for the fifth round: 13, 12, 12, 12, 12, 12.
Converged. Every safety regression since round 4 came from a partial-line check: a next-word
carve-out (D-041, D-050, D-070), an idiom checked inside one clause (D-055, D-061, D-071), or a
narrowed pattern (D-066). The builder also found that the round-7 and round-8 disclosure probes
had never reached the test file (an edit that silently matched nothing), so two commit messages
overstated the tests.

## Now (round 10, hand-over)

1. **Remove partial-line matching from the design** [C4] — tier 1 grow-only with complete-phrase
   exceptions only (D-070); tier 2 exempt only when the whole line equals a closed idiom template,
   so no clause or sentence can hide behind one (D-071); any bare "stop" clause stops, and only
   "pause" keeps the pushback rule (D-072); stop word lists moved to data; the 13 D-056 phrasings;
   D-073's status lines as whole-line templates. Every probe line from rounds 3-9 is now actually
   in the tests (121 were missing), plus generated cross-sentence and cross-clause lines.
2. **Final review, then the final packet.**

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
