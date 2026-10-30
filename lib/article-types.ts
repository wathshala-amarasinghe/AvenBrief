export type ArticleRecord = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  category: string;
  author_name: string;
  source_url: string | null;
  featured_image_url: string | null;
  image_alt: string;
  image_credit: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
};

export type ArticleInput = Pick<
  ArticleRecord,
  "title" | "slug" | "summary" | "body" | "category" | "author_name" | "source_url" | "featured_image_url" | "image_alt" | "image_credit"
> & { intent: "draft" | "publish" };

export type EditorState = { error: string };

export type ArticlePreview = Pick<
  ArticleRecord,
  "id" | "slug" | "title" | "summary" | "category" | "author_name" | "published_at" | "featured_image_url" | "image_alt" | "image_credit"
>;

export type PublishedArticlePage = {
  articles: ArticlePreview[];
  count: number;
  page: number;
  totalPages: number;
};
