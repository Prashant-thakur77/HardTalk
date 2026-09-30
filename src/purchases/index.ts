import { useSyncExternalStore } from 'react';

import { config } from '@/config';

import { unlockedMessage } from './copy';
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

/** A purchase problem is shown where the user is, never swallowed; a purchase that lands says so. */
export interface PurchaseNoticeMessage {
  tone: 'error' | 'success';
  text: string;
}

const SUCCESS_MS = 10000;
let notice: PurchaseNoticeMessage | null = null;
let clearSuccess: ReturnType<typeof setTimeout> | undefined;
const noticeListeners = new Set<() => void>();

function setNotice(message: string | null, tone: PurchaseNoticeMessage['tone'] = 'error') {
  clearTimeout(clearSuccess);
  notice = message ? { tone, text: message } : null;
  noticeListeners.forEach((listener) => listener());
  if (message && tone === 'success') clearSuccess = setTimeout(() => setNotice(null), SUCCESS_MS);
}

export function usePurchaseNotice(): PurchaseNoticeMessage | null {
  return useSyncExternalStore(
    (listener) => {
      noticeListeners.add(listener);
      return () => noticeListeners.delete(listener);
    },
    () => notice,
    () => notice,
  );
}

const describe = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Configures purchases once and loads the current entitlement. */
export async function initPurchases(): Promise<void> {
  const active = purchases();
  if (!active) {
    setNotice(unavailable);
    return;
  }
  try {
    setPro(await active.refresh());
  } catch (error) {
    setNotice(`Couldn't check your purchases: ${describe(error)}`);
  }
}

export async function presentPaywall(context: PaywallContext): Promise<PaywallOutcome> {
  const active = purchases();
  if (!active) {
    setNotice(unavailable);
    return 'error';
  }
  setNotice(null);
  try {
    const outcome = await active.presentPaywall(context);
    if (outcome === 'purchased' || outcome === 'restored') {
      setPro(await active.refresh());
      setNotice(unlockedMessage, 'success');
    }
    if (outcome === 'error') setNotice('The purchase did not go through. Nothing was charged.');
    return outcome;
  } catch (error) {
    setNotice(`The paywall couldn't open: ${describe(error)}`);
    return 'error';
  }
}

/** Resolves to a message for the user: restored, nothing found, or what went wrong. */
export async function restorePurchases(): Promise<string> {
  const active = purchases();
  if (!active) return unavailable ?? 'Purchases are not available.';
  try {
    const pro = await active.restore();
    setPro(pro);
    return pro ? 'Pro is active on this device.' : 'No previous purchase found.';
  } catch (error) {
    return `Couldn't restore purchases: ${describe(error)}`;
  }
}

export { usePro } from './entitlement';
export type { PaywallContext, PaywallOutcome } from './types';
