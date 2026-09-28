# PLAN

Live plan for HardTalk. Rewritten from SCORECARD.md at the end of every round, not from the
previous plan. Every item names the criterion it moves (CLAUDE.md §3).

**Round 7 score: 12/20** (C1 2 · C2 4 · C3 3 · C4 3), flat for the third round: 13, 12, 12, 12. By the
exit rule's convergence test the loop has converged. The other two exit conditions (every
criterion ≥ 4, zero P0) cannot be met from this machine: C1 and C3 need a phone and keys.

## Now (round 8, the last)

1. **Close the demo-killer and the safety P1 before handing over** [C1] [C4] — D-064 ("Can I stop
   you there?" must stay roleplay; it is the natural move in the uncut take), D-061 (closed
   idioms with no gaps, so "That man touched me" and "The call ended and he hit me" always
   count), D-062 (exact-continuation exceptions for "shoot myself in the foot", "beat me to it",
   "kicked me off the call"), D-063 (stops checked clause by clause; persona names anywhere),
   D-065 (a failed model check is reported, never read as "no distress"; a late flag deletes the
   saved attempt). Every probe line is a test.
2. **Hand over** — final review to confirm nothing regressed, then the final packet.

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
