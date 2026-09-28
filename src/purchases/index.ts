import { config } from '@/config';

import { setPro } from './entitlement';
import { mockPurchases } from './mock';
import type { PaywallContext, PaywallOutcome, PurchasesProvider } from './types';

let provider: PurchasesProvider | null = null;
let unavailable: string | null = null;

function purchases(): PurchasesProvider | null {
  if (provider || unavailable) return provider;
  if (config.mock) {
    provider = mockPurchases;
  } else if (!config.revenueCatKey) {
    unavailable = 'Purchases are not configured. Set EXPO_PUBLIC_REVENUECAT_TEST_KEY.';
  } else {
    try {
      // Loaded only in live mode so mock mode never touches the native module.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createRevenueCat } = require('./revenuecat') as typeof import('./revenuecat');
      provider = createRevenueCat(config.revenueCatKey);
    } catch (error) {
      unavailable = error instanceof Error ? error.message : String(error);
    }
  }
  provider?.onChange(setPro);
  return provider;
}

/** Configures purchases once and loads the current entitlement. */
export async function initPurchases(): Promise<void> {
  const active = purchases();
  if (active) setPro(await active.refresh());
}

export function purchasesUnavailableReason(): string | null {
  purchases();
  return unavailable;
}

export async function presentPaywall(context: PaywallContext): Promise<PaywallOutcome> {
  const active = purchases();
  if (!active) return 'error';
  const outcome = await active.presentPaywall(context);
  if (outcome === 'purchased' || outcome === 'restored') setPro(await active.refresh());
  return outcome;
}

export async function restorePurchases(): Promise<boolean> {
  const active = purchases();
  if (!active) return false;
  const pro = await active.restore();
  setPro(pro);
  return pro;
}

export { usePro } from './entitlement';
export type { PaywallContext, PaywallOutcome } from './types';
