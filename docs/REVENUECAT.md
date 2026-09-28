# RevenueCat setup

HardTalk sells one thing: the `pro` entitlement, which unlocks unlimited graded sessions, your own scenarios and progress history. Purchases run through the RevenueCat Test Store, so no App Store or Play listing is needed.

The paywall opens in exactly two places, both in `src/session/start.ts`:

1. Starting a fourth graded session as a free user (three are free). Both "Start conversation" and "Retry" go through this check.
2. Tapping "Create your own scenario".

Restore purchases is on the home screen, and the entitlement listener in `src/purchases/revenuecat.ts` unlocks Pro the moment a purchase or restore lands, without a restart.

## Dashboard steps

1. Create a project and add the Test Store app. Copy its public API key (it starts with `test_`).
2. Products: create `hardtalk_pro_monthly` ($4.99 a month) and `hardtalk_pro_annual` ($29.99 a year) in the Test Store.
3. Entitlements: create `pro` and attach both products.
4. Offerings: make `default` the current offering, with a Monthly package (`$rc_monthly`) and an Annual package (`$rc_annual`).
5. Paywalls: create a V2 paywall on `default`. Under custom variables add these three, with the defaults shown:

   | Variable | Default |
   | --- | --- |
   | `scenario_title` | `your next conversation` |
   | `score_line` | leave empty |
   | `reason` | `session_limit` |

   Use this copy (the same text the mock paywall renders from `data/paywall.yaml`):

   - Headline: `Keep practising "{{ custom.scenario_title }}"`
   - Body: `You've used your three free graded sessions. The next retry is usually where the new line sticks.`
   - Score line: `Your score on it so far: {{ custom.score_line }}`
   - Features: Unlimited graded sessions and retries. Your own scenarios, with your real names and stakes. Progress history across every attempt.

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
2. Start a fourth: the paywall names the scenario you just practised and your score on it.
3. Buy the annual plan in the Test Store sheet. The session starts, and "Your progress" and "Create your own scenario" unlock with no restart.
4. Delete and reinstall the app, then tap "Restore purchases". Pro comes back.
