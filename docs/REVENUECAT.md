# RevenueCat setup

HardTalk sells one thing: the `pro` entitlement, which unlocks unlimited graded sessions, your own scenarios and progress history. Purchases run through the RevenueCat Test Store, so no App Store or Play listing is needed.

The paywall opens in exactly two places, both in `src/session/start.ts`:

1. Starting a fourth graded session as a free user (three are free). Both "Start conversation" and "Retry" go through this check. Sessions are counted on the device by a counter that "Delete my practice history" does not reset; a reinstall does, since there are no accounts.
2. Tapping "Create your own scenario".

Restore purchases is on the home screen, and the entitlement listener in `src/purchases/revenuecat.ts` unlocks Pro the moment a purchase or restore lands, without a restart.

## Dashboard steps

1. Create a project and add the Test Store app. Copy its public API key (it starts with `test_`).
2. Products: create `hardtalk_pro_weekly` ($2.99 a week), `hardtalk_pro_monthly` ($4.99 a month) and `hardtalk_pro_annual` ($29.99 a year) in the Test Store, all attached to the `pro` entitlement. The weekly plan is the "One-week pass": practice comes in bursts before one real conversation, so it matches how people actually need Pro.
3. Entitlements: create `pro` and attach all three products.
4. Offerings: make `default` the current offering, with a Weekly package (`$rc_weekly`), a Monthly package (`$rc_monthly`) and an Annual package (`$rc_annual`). On the V2 paywall, label the weekly one "One-week pass".
5. Paywalls: create one V2 paywall on `default`. The app writes the words for each moment from `data/paywall.yaml` and passes them as custom variables, so this one paywall says the right thing at both entry points. Add these custom variables, with the defaults shown:

   | Variable | Default | Filled with |
   | --- | --- | --- |
   | `headline` | `HardTalk Pro` | "Keep practising "…"" or "Rehearse the conversation you're actually dreading" |
   | `body` | `Unlimited practice, your own scenarios, and your progress over time.` | The reason-specific line |
   | `example` | leave empty | At "Create your own": a panel drafted from a sample of the track the user was browsing, in one line. Empty at the session limit |
   | `score_line` | leave empty | "Your score on it so far: 7 → 14 out of 16." or empty on a fresh install |

   Lay the paywall out as: headline `{{ custom.headline }}`, body `{{ custom.body }}`, a highlighted line `{{ custom.score_line }}`, then the three features (Unlimited graded sessions and retries; A panel built from your real job posting, pitch or motion; Progress history across every attempt) and the three packages. `scenario_title` and `reason` are also sent, if you want them in the layout.

6. Put the key in `.env.local` in the repo root:

   ```sh
   EXPO_PUBLIC_REVENUECAT_TEST_KEY=test_...
   ```

## Rules the code enforces

- A `test_` key is refused outside a development build (`__DEV__`), because the SDK deliberately crashes release builds that contain one. Record demos on a development build.
- In mock mode the RevenueCat module is never loaded. The mock paywall at `app/paywall.tsx` shows the same copy, labelled as a mock, and charges nothing.
- Expo Go runs RevenueCat in preview mode, where purchases do not complete. Use the development build from `docs/DEVICE.md`.
- After adding `react-native-purchases`, hot reload can throw `new NativeEventEmitter() requires a non-null argument`. Rebuild the development build.

## Checking it on a phone

1. Fresh install, live mode. Complete three graded sessions.
2. Start a fourth: the paywall names the scenario you are starting and your score on it so far.
3. Buy the annual plan in the Test Store sheet. The session starts, and "Your progress" and "Create your own scenario" unlock with no restart.
4. Tap "Restore purchases" and check that Pro stays active. Then try it after deleting and reinstalling the app. HardTalk has no accounts, so RevenueCat gives each install an anonymous user ID, and it is not documented whether a Test Store purchase restores across that. Film it working before claiming it, and if it does not, say so in the submission.
