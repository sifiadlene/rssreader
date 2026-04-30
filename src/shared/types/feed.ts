export interface Feed {
  id: number;
  title: string;
  url: string;
  description: string | null;
  siteUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
