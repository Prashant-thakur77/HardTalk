# PLAN

Live plan for HardTalk. Rewritten from SCORECARD.md at the end of every round, not from the
previous plan. Every item names the criterion it moves (CLAUDE.md §3).

**Round 6 score: 12/20** (C1 2 · C2 4 · C3 3 · C4 3), flat. Totals: 6, 9, 12, 13, 12, 12. C4 keeps
losing its point to the distress filter: three rounds of keyword fixes, three regressions
(D-041, D-050, D-055). A list alone is a treadmill.

**Hard ceiling, stated honestly:** C1 and C3 are capped here at "code complete, tested, bundled";
the four P0s close only with one recorded session on a phone with keys.

## Now (round 7)

1. **Stop the safety treadmill structurally** [C4] — D-055, D-056, D-057. Tier 1 explicit
   disclosures that nothing can cancel; tier 2 ambiguous words cancelled only when a sentence-
   anchored idiom covers that exact occurrence; normalisation for "wanna", "my self", spacing.
   And the part the Phase 6 spec asked for and was never built: a server-side model check on every
   live user line, for paraphrases no list covers. Every probe line from every round is a test.
2. **Stops that stop** [C4] — D-058: the persona's name, "stop that", "pls", longer polite
   requests, and a stop sentence followed by more ("Stop. I can't do this.").
3. **No comments about words never said** [C1] [C2] — D-059 (a score-1 comment that rested on
   stripped quotes is replaced), D-060 (deterministic, committed baseline; paid runs git-ignored).

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
