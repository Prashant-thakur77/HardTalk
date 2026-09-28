import Purchases, { type CustomerInfo } from 'react-native-purchases';
import RevenueCatUI, { CustomVariableValue, PAYWALL_RESULT } from 'react-native-purchases-ui';

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
 * RevenueCat with the Test Store. The entitlement is `pro`; the paywall is the remote one
 * configured in the dashboard, fed the scenario the user just practised through custom
 * variables (see docs/REVENUECAT.md).
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
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT,
        customVariables: {
          scenario_title: CustomVariableValue.string(context.scenarioTitle),
          score_line: CustomVariableValue.string(context.scoreLine ?? ''),
          reason: CustomVariableValue.string(context.reason),
        },
      });
      return OUTCOMES[result];
    },

    restore: async () => hasPro(await Purchases.restorePurchases()),
  };
}
