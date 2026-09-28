import { beforeEach, describe, expect, it, vi } from 'vitest';

const rc = vi.hoisted(() => ({
  configure: vi.fn(),
  listeners: [] as ((info: unknown) => void)[],
  customerInfo: { entitlements: { active: {} as Record<string, unknown> } },
  paywallResult: 'PURCHASED',
  paywallParams: null as unknown,
}));

vi.mock('react-native-purchases', () => ({
  default: {
    configure: rc.configure,
    getCustomerInfo: async () => rc.customerInfo,
    restorePurchases: async () => rc.customerInfo,
    addCustomerInfoUpdateListener: (listener: (info: unknown) => void) => rc.listeners.push(listener),
    removeCustomerInfoUpdateListener: vi.fn(),
  },
}));
vi.mock('react-native-purchases-ui', () => ({
  default: {
    presentPaywallIfNeeded: async (params: unknown) => {
      rc.paywallParams = params;
      return rc.paywallResult;
    },
  },
  CustomVariableValue: { string: (value: string) => ({ type: 'string', value }) },
  PAYWALL_RESULT: {
    PURCHASED: 'PURCHASED',
    RESTORED: 'RESTORED',
    CANCELLED: 'CANCELLED',
    ERROR: 'ERROR',
    NOT_PRESENTED: 'NOT_PRESENTED',
  },
}));

const { createRevenueCat, ENTITLEMENT } = await import('../revenuecat');

const withPro = { entitlements: { active: { pro: { identifier: 'pro' } } } };
const withoutPro = { entitlements: { active: {} } };

describe('RevenueCat provider', () => {
  beforeEach(() => {
    rc.configure.mockReset();
    rc.listeners = [];
    rc.customerInfo = withoutPro;
    rc.paywallResult = 'PURCHASED';
    vi.stubGlobal('__DEV__', true);
  });

  it('uses the "pro" entitlement', () => {
    expect(ENTITLEMENT).toBe('pro');
  });

  it('refuses a Test Store key outside a development build, where the SDK would crash', () => {
    vi.stubGlobal('__DEV__', false);
    expect(() => createRevenueCat('test_abc')).toThrow(/development build/);
    expect(rc.configure).not.toHaveBeenCalled();
  });

  it('opens the paywall only if pro is missing, with the scenario as custom variables', async () => {
    const purchases = createRevenueCat('test_abc');
    const outcome = await purchases.presentPaywall({
      reason: 'session_limit',
      scenarioTitle: "Your teammate's PR is blocking the release",
      scoreLine: '6 → 14 out of 16',
    });
    expect(outcome).toBe('purchased');
    expect(rc.paywallParams).toEqual({
      requiredEntitlementIdentifier: 'pro',
      customVariables: {
        scenario_title: { type: 'string', value: "Your teammate's PR is blocking the release" },
        score_line: { type: 'string', value: '6 → 14 out of 16' },
        reason: { type: 'string', value: 'session_limit' },
      },
    });
  });

  it('maps a cancelled paywall to cancelled', async () => {
    rc.paywallResult = 'CANCELLED';
    const outcome = await createRevenueCat('test_abc').presentPaywall({
      reason: 'custom_scenario',
      scenarioTitle: 'x',
      scoreLine: null,
    });
    expect(outcome).toBe('cancelled');
  });

  it('flips the entitlement live from the customer-info listener, without a restart', () => {
    const changes: boolean[] = [];
    createRevenueCat('test_abc').onChange((pro) => changes.push(pro));
    rc.listeners.forEach((listener) => listener(withPro));
    expect(changes).toEqual([true]);
  });

  it('restores an earlier purchase', async () => {
    rc.customerInfo = withPro;
    await expect(createRevenueCat('test_abc').restore()).resolves.toBe(true);
  });
});
