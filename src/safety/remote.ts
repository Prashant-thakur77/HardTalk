import { config } from '@/config';

/**
 * Live mode only: asks /server whether a line the on-device rules passed is distress. Runs in
 * the background; a network failure never interrupts the practice, it just means the rules and
 * the persona's own instruction are the only checks for that line.
 */
export async function checkDistressRemotely(text: string): Promise<boolean> {
  if (config.mock) return false;
  try {
    const response = await fetch(`${config.serverUrl}/safety/check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) return false;
    return ((await response.json()) as { distress?: boolean }).distress === true;
  } catch {
    return false;
  }
}
