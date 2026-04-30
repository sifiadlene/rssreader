import { describe, expect, it, vi } from 'vitest';

type TestDatabase = {
  prepare: (sql: string) => {
    all: () => Array<{ name: string }>;
  };
};

async function loadDatabase() {
  vi.resetModules();
  process.env.DATABASE_PATH = ':memory:';

  try {
    const databaseModule = (await import('../models/database.js')) as { default: TestDatabase };
    return databaseModule.default;
  } catch (error) {
    throw new Error(`Expected src/server/models/database.ts to exist for database tests. ${(error as Error).message}`);
  }
}

describe('database contract', () => {
  it('initializes an in-memory database and creates the required tables and indexes', async () => {
    const db = await loadDatabase();

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('feeds', 'articles') ORDER BY name")
      .all();

    expect(tables).toEqual([{ name: 'articles' }, { name: 'feeds' }]);

    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND name IN ('idx_articles_feed_id', 'idx_articles_pub_date') ORDER BY name",
      )
      .all();

    expect(indexes).toEqual([{ name: 'idx_articles_feed_id' }, { name: 'idx_articles_pub_date' }]);
  });
});
