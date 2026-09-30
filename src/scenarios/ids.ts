/** Custom (Pro) scenarios carry a `custom-` id, so the server knows to take them in full. */
export const isCustomScenario = (id: string) => id.startsWith('custom-');

export function customScenarioId(title: string, now = Date.now()): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return `custom-${slug || 'scenario'}-${now}`;
}
