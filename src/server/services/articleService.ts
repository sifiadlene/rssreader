import type { Article } from '../../shared/types/article.js';
import { AppError } from '../middleware/errorHandler.js';
import { listArticlesByFeedId, markArticleAsRead } from '../models/articleModel.js';

export const getArticles = (feedId: number): Article[] => listArticlesByFeedId(feedId);

export const markAsRead = (articleId: number): Article => {
  const article = markArticleAsRead(articleId);
  if (!article) {
    throw new AppError(404, 'Article not found', 'ARTICLE_NOT_FOUND');
  }

  return article;
};
