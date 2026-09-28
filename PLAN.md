# PLAN

Live plan for HardTalk. Rewritten from SCORECARD.md at the end of every round, not from the
previous plan. Every item names the criterion it moves (CLAUDE.md §3).

**Round 10 score: 12/20** (C1 2 · C2 4 · C3 3 · C4 3), flat for the sixth round: 6, 9, 12, 13, 12,
12, 12, 12, 12, 12. The first round since round 4 with no regression of any previously logged safety
line. The loop has converged; this is the hand-over state.

**Exit condition, honestly:** converged, yes. Every criterion ≥ 4 and zero P0: no, and not
reachable from this machine. C1 and C3 need the owner's phone session with keys, and C4's last
point needs a real grader number and a real user quote. See Next.

## Now (hand-over)

1. **Round 10 fixes, then stop** [C4] — D-074 (jump pattern restored whole; no next-word carve-out
   left), D-075 (present tense assault, "hurting me", abuse, reported threats, a plan followed by a
   comma), D-076 (a sentence that opens with "stop" stops; "Can you stop?"; frightened pause
   trailers), D-078 (the always-stop word in data; the pausing premises listed as accepted false
   positives). These fixes come after the last review and are verified by tests and the browser
   suites only.

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
