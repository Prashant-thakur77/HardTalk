import { useSyncExternalStore } from 'react';

let pro = false;
const listeners = new Set<() => void>();

export function setPro(value: boolean) {
  if (value === pro) return;
  pro = value;
  listeners.forEach((listener) => listener());
}

export function isPro(): boolean {
  return pro;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The live `pro` entitlement. Re-renders the moment a purchase or restore lands. */
export function usePro(): boolean {
  return useSyncExternalStore(subscribe, isPro, isPro);
}
