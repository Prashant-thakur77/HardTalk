import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

import type { PaywallContext, PaywallOutcome, PurchasesProvider } from './types';

/** Stands in for the store's receipt, so Pro survives a reload and Restore can find it. */
const STORAGE_KEY = 'hardtalk.mock-pro.v1';

let pro = false;
const listeners = new Set<(pro: boolean) => void>();
let pending: ((outcome: PaywallOutcome) => void) | null = null;

function setMockPro(value: boolean) {
  pro = value;
  listeners.forEach((listener) => listener(value));
  void AsyncStorage.setItem(STORAGE_KEY, value ? '1' : '0');
}

/** Called by app/paywall.tsx when the mock paywall closes. */
export function resolveMockPaywall(outcome: PaywallOutcome) {
  if (outcome === 'purchased') setMockPro(true);
  pending?.(outcome);
  pending = null;
}

/**
 * Mock mode stands in for RevenueCat with a local paywall screen that shows the same
 * scenario-aware copy, labelled as a mock. Nothing is charged and nothing leaves the device.
 */
export const mockPurchases: PurchasesProvider = {
  refresh: async () => {
    pro = (await AsyncStorage.getItem(STORAGE_KEY)) === '1';
    return pro;
  },
  onChange: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  presentPaywall: (context: PaywallContext) =>
    new Promise((resolve) => {
      pending = resolve;
      router.push({
        pathname: '/paywall',
        params: {
          reason: context.reason,
          scenarioTitle: context.scenarioTitle ?? '',
          scoreLine: context.scoreLine ?? '',
          track: context.track ?? '',
        },
      });
    }),
  restore: async () => (await AsyncStorage.getItem(STORAGE_KEY)) === '1',
};
