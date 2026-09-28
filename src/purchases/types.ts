/** Why the paywall is opening. These are the only two places it ever opens. */
export type PaywallReason = 'session_limit' | 'custom_scenario';

/** What the paywall copy refers to: the conversation the user just practised. */
export interface PaywallContext {
  reason: PaywallReason;
  /** The scenario being started (session limit) or last practised; null on a fresh install. */
  scenarioTitle: string | null;
  /** e.g. "6 → 14 out of 16", or null before any graded attempt. */
  scoreLine: string | null;
}

export type PaywallOutcome = 'purchased' | 'restored' | 'cancelled' | 'error';

export interface PurchasesProvider {
  /** Current entitlement, refreshed from the store. */
  refresh(): Promise<boolean>;
  /** Called whenever the `pro` entitlement changes, including mid-session after a purchase. */
  onChange(listener: (pro: boolean) => void): () => void;
  presentPaywall(context: PaywallContext): Promise<PaywallOutcome>;
  /** Returns whether `pro` is active after restoring. */
  restore(): Promise<boolean>;
}
