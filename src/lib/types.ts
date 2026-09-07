export type CategoryType = 'primary' | 'secondary';
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: CategoryType;
  position: number;
}
export interface ArticleImage {
  url: string;
  alt: string;
  credit?: string;
  source?: string;
}
export interface InlineImage extends ArticleImage {
  afterBlock: number;
}
export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'quote' | 'list';
  text: string;
}
export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: ContentBlock[];
  headerImage: ArticleImage;
  inlineImages: InlineImage[];
  primaryCategoryId: string;
  secondaryCategoryId: string | null;
  status: 'draft' | 'published';
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
  author: string;
  primaryCategory?: Category;
  secondaryCategory?: Category | null;
}
export interface ArticlePage {
  articles: Article[];
  nextPage: number | null;
  total: number;
}
export type AdSlot =
  'category-top' | 'article-top' | 'article-middle' | 'article-bottom';
export interface Advertisement {
  id: string;
  slot: AdSlot;
  advertiser: string;
  title: string;
  image: ArticleImage | null;
  targetUrl: string;
  active: boolean;
}
export const readMinutes = (body: ContentBlock[]) =>
  Math.max(
    1,
    Math.ceil(
      body
        .map((b) => b.text)
        .join(' ')
        .split(/\s+/).length / 210,
    ),
  );
export const dateLabel = (date: string | null) =>
  date
    ? new Date(date).toLocaleDateString('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : 'Draft';
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
