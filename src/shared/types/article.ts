export interface Article {
  id: number;
  feedId: number;
  title: string;
  link: string;
  snippet: string | null;
  author: string | null;
  pubDate: string | null;
  guid: string | null;
  isRead: boolean;
  createdAt: string;
}
