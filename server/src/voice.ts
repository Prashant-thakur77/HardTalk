/**
 * Mints a short-lived ElevenLabs conversation token for the persona agent. The app receives
 * only this token; the ElevenLabs key never leaves the server.
 */
export function elevenLabsTokenMinter({ apiKey, agentId }: { apiKey: string; agentId: string }) {
  return async (): Promise<string> => {
    const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/token');
    url.searchParams.set('agent_id', agentId);
    const response = await fetch(url, { headers: { 'xi-api-key': apiKey } });
    if (!response.ok) throw new Error(`ElevenLabs token request failed with ${response.status}.`);
    const body = (await response.json()) as { token?: string };
    if (!body.token) throw new Error('ElevenLabs returned no conversation token.');
    return body.token;
  };
}
