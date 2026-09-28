import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { defineConfig, type Plugin } from 'vitest/config';

// Mirrors metro.yaml-transformer.js so tests import YAML exactly like the app does.
const yamlPlugin: Plugin = {
  name: 'yaml',
  load(id) {
    if (!id.endsWith('.yaml')) return null;
    return `export default ${JSON.stringify(YAML.parse(readFileSync(id, 'utf8')))};`;
  },
};

export default defineConfig({
  plugins: [yamlPlugin],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('./data', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/__tests__/**/*.test.ts', 'server/**/__tests__/**/*.test.ts', 'evals/**/__tests__/**/*.test.ts'],
  },
});
