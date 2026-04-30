import type { Article } from '../../shared/types/article.js';
import db from './database.js';

interface ArticleRow {
  id: number;
  feed_id: number;
  title: string;
  link: string;
  snippet: string | null;
  author: string | null;
  pub_date: string | null;
  guid: string | null;
  is_read: number;
  created_at: string;
}

export interface ArticleCreateInput {
  feedId: number;
  title: string;
  link: string;
  snippet?: string | null;
  author?: string | null;
  pubDate?: string | null;
  guid?: string | null;
  isRead?: boolean;
}

const mapArticleRow = (row: ArticleRow): Article => ({
  id: row.id,
  feedId: row.feed_id,
  title: row.title,
  link: row.link,
  snippet: row.snippet,
  author: row.author,
  pubDate: row.pub_date,
  guid: row.guid,
  isRead: Boolean(row.is_read),
  createdAt: row.created_at,
});

const listArticlesByFeedIdStatement = db.prepare(`
  SELECT * FROM articles
  WHERE feed_id = ?
  ORDER BY COALESCE(pub_date, created_at) DESC, id DESC
`);
const getArticleByIdStatement = db.prepare('SELECT * FROM articles WHERE id = ?');
const insertArticleStatement = db.prepare(`
  INSERT OR IGNORE INTO articles (feed_id, title, link, snippet, author, pub_date, guid, is_read)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const updateArticleByGuidStatement = db.prepare(`
  UPDATE articles
  SET title = ?,
      link = ?,
      snippet = ?,
      author = ?,
      pub_date = ?
  WHERE feed_id = ? AND guid = ?
`);
const deleteArticlesByFeedIdStatement = db.prepare('DELETE FROM articles WHERE feed_id = ?');
const markArticleAsReadStatement = db.prepare(`
  UPDATE articles
  SET is_read = 1
  WHERE id = ?
`);

export const listArticlesByFeedId = (feedId: number): Article[] =>
  listArticlesByFeedIdStatement.all(feedId).map((row) => mapArticleRow(row as ArticleRow));

export const getArticlesByFeedId = (feedId: number): Article[] => listArticlesByFeedId(feedId);

export const getArticleById = (id: number): Article | null => {
  const row = getArticleByIdStatement.get(id) as ArticleRow | undefined;
  return row ? mapArticleRow(row) : null;
};

export const createArticle = (input: ArticleCreateInput): Article => {
  const guid = input.guid ?? input.link;
  const result = insertArticleStatement.run(
    input.feedId,
    input.title,
    input.link,
    input.snippet ?? null,
    input.author ?? null,
    input.pubDate ?? null,
    guid,
    input.isRead ? 1 : 0,
  );

  return getArticleById(Number(result.lastInsertRowid)) as Article;
};

export const upsertArticle = (input: ArticleCreateInput): boolean => {
  const guid = input.guid ?? input.link;
  const insertResult = insertArticleStatement.run(
    input.feedId,
    input.title,
    input.link,
    input.snippet ?? null,
    input.author ?? null,
    input.pubDate ?? null,
    guid,
    input.isRead ? 1 : 0,
  );

  if (insertResult.changes === 0) {
    updateArticleByGuidStatement.run(
      input.title,
      input.link,
      input.snippet ?? null,
      input.author ?? null,
      input.pubDate ?? null,
      input.feedId,
      guid,
    );
  }

  return insertResult.changes > 0;
};

export const upsertArticles = (articles: ArticleCreateInput[]): number => {
  const transaction = db.transaction((records: ArticleCreateInput[]) =>
    records.reduce((count, record) => count + (upsertArticle(record) ? 1 : 0), 0),
  );

  return transaction(articles);
};

export const deleteArticlesByFeedId = (feedId: number): void => {
  deleteArticlesByFeedIdStatement.run(feedId);
};

export const markArticleAsRead = (id: number): Article | null => {
  const result = markArticleAsReadStatement.run(id);
  if (result.changes === 0) {
    return null;
  }

  return getArticleById(id);
};
