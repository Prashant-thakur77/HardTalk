# PLAN

Live plan for HardTalk. Rewritten from the scorecard at the end of every round.
Every item is tagged with the judging criterion it serves (see CLAUDE.md §3).

## Now

1. **Phase 0 — Skeleton + mock mode** [C1] [C2]
   `VoiceProvider` interface + `MockVoiceProvider`, `EXPO_PUBLIC_MOCK` switch,
   scenario list → session → scorecard driven by the mock.
   Acceptance: `EXPO_PUBLIC_MOCK=1 pnpm dev` runs the full loop with no API keys.

## Next

2. **Phase 1 — Scenario + rubric data** [C2] [C4]
3. **Phase 2 — Grader with evidence gating** [C1] [C4]
4. **Phase 3 — Real voice (ElevenLabs) + token server** [C1]
5. **Phase 4 — RevenueCat entitlement, boundary paywall, restore** [C3]
6. **Phase 5 — Accessibility + text-only mode** [C4]
7. **Phase 6 — Safety: stop word, distress path, SAFETY.md** [C4]
8. **Phase 7 — Evals + README + LICENSE polish** [C2] [C4]

## Rejected

_Nothing yet._
