import Purchases, { type CustomerInfo } from 'react-native-purchases';
import RevenueCatUI, { CustomVariableValue, PAYWALL_RESULT } from 'react-native-purchases-ui';

import { paywallCopy } from './copy';
import type { PaywallContext, PaywallOutcome, PurchasesProvider } from './types';

export const ENTITLEMENT = 'pro';

const hasPro = (info: CustomerInfo) => info.entitlements.active[ENTITLEMENT] !== undefined;

const OUTCOMES: Record<PAYWALL_RESULT, PaywallOutcome> = {
  [PAYWALL_RESULT.PURCHASED]: 'purchased',
  [PAYWALL_RESULT.RESTORED]: 'restored',
  [PAYWALL_RESULT.CANCELLED]: 'cancelled',
  [PAYWALL_RESULT.ERROR]: 'error',
  // presentPaywallIfNeeded skips the paywall when `pro` is already active.
  [PAYWALL_RESULT.NOT_PRESENTED]: 'restored',
};

/**
 * RevenueCat with the Test Store. The entitlement is `pro`. The paywall is the remote one built
 * in the dashboard; its headline, body and score line are custom variables filled from
 * data/paywall.yaml for this moment, so each entry point says the right thing about the scenario
 * in question (see docs/REVENUECAT.md).
 */
export function createRevenueCat(apiKey: string): PurchasesProvider {
  // The SDK deliberately crashes release builds that contain a Test Store key.
  if (apiKey.startsWith('test_') && !__DEV__) {
    throw new Error('A RevenueCat Test Store key can only be used in a development build.');
  }
  Purchases.configure({ apiKey });

  return {
    refresh: async () => hasPro(await Purchases.getCustomerInfo()),

    onChange: (listener) => {
      const update = (info: CustomerInfo) => listener(hasPro(info));
      Purchases.addCustomerInfoUpdateListener(update);
      return () => {
        Purchases.removeCustomerInfoUpdateListener(update);
      };
    },

    presentPaywall: async (context: PaywallContext) => {
      const copy = paywallCopy(context);
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT,
        customVariables: {
          headline: CustomVariableValue.string(copy.headline),
          body: CustomVariableValue.string(copy.body),
          score_line: CustomVariableValue.string(copy.score ?? ''),
          scenario_title: CustomVariableValue.string(context.scenarioTitle ?? ''),
          reason: CustomVariableValue.string(context.reason),
        },
      });
      return OUTCOMES[result];
    },

    restore: async () => hasPro(await Purchases.restorePurchases()),
  };
}
