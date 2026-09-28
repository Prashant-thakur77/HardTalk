/**
 * Mock mode is the default so `pnpm dev` works with zero keys and zero network.
 * Real voice, grading and purchases need EXPO_PUBLIC_MOCK=0 and a running /server.
 */
export const config = {
  mock: process.env.EXPO_PUBLIC_MOCK !== '0',
  serverUrl: process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:8787',
  /** RevenueCat Test Store public key. Debug builds only: the SDK crashes release builds that ship one. */
  revenueCatKey: process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY ?? '',
};
