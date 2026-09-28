import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config', () => ({ config: { mock: false, serverUrl: 'http://server.test' } }));
const { checkDistressRemotely } = await import('../remote');

function reply(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })));
}

describe('checkDistressRemotely', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('passes on the model verdict', async () => {
    reply(200, { distress: true, source: 'model' });
    await expect(checkDistressRemotely('…')).resolves.toEqual({ distress: true, checked: true });
    expect(fetch).toHaveBeenCalledWith('http://server.test/safety/check', expect.objectContaining({ method: 'POST' }));
  });

  it('reports that the model check did not run when the server says so', async () => {
    reply(200, { distress: false, source: 'rules', modelError: true });
    await expect(checkDistressRemotely('…')).resolves.toEqual({ distress: false, checked: false });
  });

  it('reports a server error or lost network as "not checked", never as "checked and fine"', async () => {
    reply(502, { error: 'unavailable' });
    await expect(checkDistressRemotely('…')).resolves.toEqual({ distress: false, checked: false });
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))));
    await expect(checkDistressRemotely('…')).resolves.toEqual({ distress: false, checked: false });
  });
});
