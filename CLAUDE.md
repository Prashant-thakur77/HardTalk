# HardTalk

Voice roleplay for difficult workplace conversations. Expo + TypeScript.

**Competition target:** RevenueCat Shipaton 2026 — **Next Gen Award** (student category).
Judged on a **2-minute demo video** and **this public open-source repository**. Prescreeners
are not required to download and run the app, but they will open this repo. Write every file
as if a judge is reading it, because one is.

---

## 1. The product, frozen

A user picks a difficult conversation, speaks it out loud with an AI persona who pushes back,
then gets a scorecard with evidence quotes and retries to see the score improve.

```
Pick scenario
  → pick difficulty (L1 cooperative / L2 defensive / L3 deflecting)
  → live voice roleplay with live captions
  → persona ends when: ask made + answered, OR 6 turns
  → scorecard: Clarity / Empathy / Ask made / Boundary held
       each with a verbatim evidence quote from the transcript
       + one suggested better line
  → Retry → score delta shown side by side
```

**Scenarios (exactly three, manager-framed):**
1. Tell a teammate their PR has been blocking the release for three days.
2. Say no to your manager's extra project without damaging the relationship.
3. Push back on a scope change your PM added mid-sprint.

**Free:** 3 scenarios, 3 graded sessions.
**Pro:** custom scenarios + progress history + unlimited grading.

### Scope freeze — do not build these
auth, cloud sync, accounts, streaks, social features, leaderboards, onboarding carousel,
notifications, analytics dashboards, settings beyond accessibility, a second platform,
a web app, a landing page inside this repo.

If a change does not improve one of the four judging criteria in section 3, do not make it.
Propose it in `PLAN.md` under "Rejected" instead.

---

## 2. Non-negotiables

- **The repo is judged.** Readable beats clever. No dead code, no commented-out blocks,
  no `TODO` left on `main`.
- **Mock mode must always work.** `EXPO_PUBLIC_MOCK=1` runs the entire loop with zero API
  keys and zero network. A judge must be able to clone and see the product in 60 seconds.
  Any change that breaks mock mode is a P0 defect.
- **No API key ever reaches the client.** All provider keys live in `/server`. The app
  receives short-lived tokens only.
- **Scores must be grounded.** Every rubric score above 1 must cite a verbatim substring of
  the transcript. An ungrounded score is a bug, not a quirk.
- **Accessibility is a feature, not a pass.** Every interactive element has
  `accessibilityLabel` and `accessibilityRole`. The full loop must be completable with a
  screen reader on and audio off.
- **Test Store key is debug-only.** The RevenueCat SDK deliberately crashes release builds
  that contain a `test_` key. Record all demos on a debug/development build.
- **Safety is shipped, not promised.** The stop word works, the distress path exits cleanly,
  no raw audio is persisted.

---

## 3. The four judging criteria (the only scoreboard that matters)

Every plan, review and commit is justified against these.

| # | Criterion | What it means here |
|---|---|---|
| **C1** | **Working and real** | Real device, real mic, real persona voice, real interruption, real purchase. Nothing faked or mocked in the demo. |
| **C2** | **Code quality** | A judge opening this repo sees a clear README, a visible licence, a legible architecture, tests that pass, and setup that works first try. |
| **C3** | **Thoughtful RevenueCat use** | Entitlement `pro`; paywall only at real boundaries; scenario-aware copy; purchase flips entitlement live; Restore Purchases works. |
| **C4** | **Does it matter** | Rubrics grounded in named frameworks (SBI, Nonviolent Communication, Crucial Conversations); accessibility; safety; a real user quote. |

---

## 4. Stack

- **App:** Expo SDK, **development build** (not Expo Go), `expo-router`, TypeScript `strict`
- **Voice:** `@elevenlabs/react-native` (WebRTC via LiveKit), always behind
  `src/voice/VoiceProvider.ts`
- **Audio:** `expo-audio` — **never `expo-av`** (removed in SDK 55)
- **Purchases:** `react-native-purchases` + `react-native-purchases-ui`, RevenueCat Test Store
- **Grader:** a model from a **different family** than the persona model; structured JSON output
- **Backend:** small Node/TypeScript service in `/server` — token minting + grading proxy
- **Storage:** local only (SQLite / AsyncStorage). No accounts.

### Known landmines
- Don't install both `react-native-webrtc` and `@livekit/react-native-webrtc`. ElevenLabs
  uses the LiveKit fork.
- Pin `@elevenlabs/react-native`; v1.0 was a breaking rewrite.
- After adding `react-native-purchases`, hot reload throws
  `Invariant Violation: new NativeEventEmitter() requires a non-null argument`. Rebuild.
- Android emulator: enable "Virtual microphone uses host audio input", or use a real device.
- Expo Go runs RevenueCat in mock Preview API Mode — purchases will not work there.

---

## 5. Repository layout

```
hardtalk/
├── README.md              # demo GIF first, then arch diagram, then 3-command setup
├── LICENSE                # MIT — must be detected in GitHub's About sidebar
├── CLAUDE.md              # this file
├── PLAN.md                # live plan: Now / Next / Rejected
├── DEFECTS.md             # ranked open defects with severity
├── SCORECARD.md           # latest self-judge scores + history table
├── ACCESSIBILITY.md       # WCAG 2.2 mapping: covered, partial, not covered
├── SAFETY.md              # guardrails, distress protocol, data handling
├── EVALS.md               # grader calibration: agreement + variance, with numbers
├── .env.example
├── app/                   # Expo Router screens
├── src/
│   ├── voice/{VoiceProvider.ts, elevenlabs.ts, mock.ts}
│   ├── grading/{rubric.schema.ts, grade.ts, evidence.ts, __tests__/}
│   ├── purchases/revenuecat.ts
│   └── a11y/
├── data/
│   ├── scenarios/*.yaml   # persona goal, hidden objection, stop condition, L1–L3
│   └── rubrics/*.yaml     # anchored 1–4 descriptors + framework citation
├── server/
├── evals/{gold/, run.ts}
└── review/                # dated self-judge reports, newest last
```

---

## 6. Working agreements

- **One phase per session.** Finish it, make its acceptance check pass, commit, then stop.
- **Commits:** `phase(N): <what changed>` or `fix(C2): <defect id>`. Every commit message
  names the criterion it serves.
- **Never mark work done without running its acceptance check.** Paste the actual command
  output. "Should work" is not evidence.
- **Data over code.** Scenarios, rubrics and prompts live in `data/*.yaml`, never inlined as
  string literals in TypeScript. A judge must be able to read the rubric without reading code.
- **Prefer deleting.** If two features compete for the demo's 2 minutes, cut one.
- **Report honestly.** If a phase is half-done, say so and log the gap in `DEFECTS.md`.
  Overclaiming corrupts the self-scoring loop, which is the only feedback signal here.

## 7. Commands

```
pnpm dev            # EXPO_PUBLIC_MOCK=1 by default
pnpm test           # unit tests, must pass before any commit
pnpm eval           # grader calibration vs evals/gold
pnpm lint           # zero warnings on main
```

## 8. Cut order under time pressure

Sacrifice in this order: EVALS → safety hardening → text-only mode → difficulty levels.
**Never cut:** the retry delta, the evidence quotes, or the RevenueCat purchase.
Those three are what the video sells and what C3 and C4 are scored on.
