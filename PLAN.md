# PLAN

Live plan for HardTalk. Rewritten from SCORECARD.md at the end of every round, not from the
previous plan. Every item names the criterion it moves (CLAUDE.md §3).

**Round 20 score: 12/20** (C1 2 · C2 4 · C3 3 · C4 3), flat since round 6: mock mode and the code
hold (1,360+ tests, browser flows with zero page errors). The cap is C1 and C3, which only the
owner's phone session moves. The round-20 UX judge scored the UI and the product 7/10 each; that round's layout fixes (shorter footers and hero, the weakest skill's line on the scorecard, the choices line on the brief, dialable helplines) are in.

## Now (rounds 13–19): bring the real one, then harden it

Evidence from past winners (Shipaton 2025: Payout, Heartbeat Hero; Gemini API Competition:
Vite Vere) is that entries win by helping one person with their own real problem. HardTalk made
you practise our scenarios; this round makes it practise yours.

1. **Draft a panel from the real thing** [C4] [C3] — Pro: paste the job posting, your pitch
   summary, the debate motion or the work situation, pick a track, and the server drafts a
   scenario for it with Claude: a lead and up to two panelists, each asking a different kind of
   question grounded in the pasted text, a goal, levels and an opening line. The draft is
   validated by the same scenario schema as the built-ins, previewed, then saved as a custom
   scenario. Prompt and output rules in `data/prompts/drafter.yaml`.
2. **Mock mode shows it too** [C1] [C2] — one sample text and its recorded draft per track, so a
   judge sees the feature with zero keys; labelled as a sample.
3. **Positioning** [C4] — "The practice panel you don't have": README, home and paywall copy.
4. **UX pass to 9** [C1] — a fresh audit after the feature, then fix what it finds.

5. **Judged as a startup** [C3] [C4] — who you won over (per-panelist verdicts from the
   scores each person cares about); a Weekly plan, because practice comes in bursts;
   an on-device "how did the real one go?" check-in; the business case in the README, sourced.

Acceptance: `pnpm test`, `pnpm lint`, `pnpm typecheck` clean; the draft endpoint is unit-tested
with a fake model; the browser flow paste → preview → save → brief works in mock mode with zero
page errors; an independent UX re-score.

## Next

4. **Owner-side, on a phone** [C1] [C3] — dev build; one
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
