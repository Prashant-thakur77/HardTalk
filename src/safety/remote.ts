import { config } from '@/config';

export interface RemoteCheck {
  distress: boolean;
  /** False when the server's model check could not run (no network, bad key, server error). */
  checked: boolean;
}

/**
 * Live mode only: asks /server whether a line the on-device rules passed is distress. Runs in
 * the background. When the model check cannot run, the practice continues on the on-device
 * rules alone, and `checked: false` lets the session say so.
 */
export async function checkDistressRemotely(text: string): Promise<RemoteCheck> {
  if (config.mock) return { distress: false, checked: false };
  try {
    const response = await fetch(`${config.serverUrl}/safety/check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) return { distress: false, checked: false };
    const body = (await response.json()) as { distress?: boolean; source?: string; modelError?: boolean };
    return { distress: body.distress === true, checked: body.source === 'model' || body.distress === true };
  } catch {
    return { distress: false, checked: false };
  }
}
