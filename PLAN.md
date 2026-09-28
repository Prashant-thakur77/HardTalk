# PLAN

Live plan for HardTalk. Rewritten from SCORECARD.md at the end of every round, not from the
previous plan. Every item names the criterion it moves (CLAUDE.md §3).

**Round 4 score: 13/20** (C1 2 · C2 4 · C3 3 · C4 4), up from 12. Biggest loss: C1 — nothing has
run on a phone or against a provider (D-001..D-004). New P1s are two safety regressions from the
round-4 fixes (D-041, D-042): fix before anything else.

**Hard ceiling, stated honestly:** C1 and C3 are capped here at "code complete, tested, bundled";
the four P0s close only with one recorded session on a phone with keys. The loop is converging
(+3, +3, +1): once the total moves less than a point across two rounds, stop and hand over.

## Now (round 5)

1. **Safety regressions** [C4] — D-041 (distress list: catch every disclosure the reviewer
   listed, by excluding known idioms instead of allow-listing endings), D-042 (the persona's stop
   line matched anywhere in its reply), D-043 ("Can we pause it?" is roleplay). Each probe line
   becomes a test. Expected: C4 holds 4 without a caveat. Effort: low.
2. **Paywall copy and eval robustness** [C3] [C2] — D-044 (score move compared at one difficulty),
   D-045 (first-try copy at the limit; stale comments), D-048 (`pnpm eval` keeps partial results
   and survives one failed grading; root declares its SDK). Effort: low.
3. **README truth** [C2] [C1] — D-046 (re-record the GIF), D-047 (the short live path creates
   `.env.local`), D-049 (mock typed mode says the persona's replies are recorded). Effort: low.

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
