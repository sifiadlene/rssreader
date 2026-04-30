import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

process.env.NODE_ENV = 'test';

for (const [key, value] of Object.entries({
  RSSREADER_DB_PATH: ':memory:',
  DATABASE_PATH: ':memory:',
  DB_PATH: ':memory:',
  SQLITE_PATH: ':memory:',
})) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

afterEach(() => {
  if (typeof document !== 'undefined') {
    cleanup();
  }

  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
