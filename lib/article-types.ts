export type ArticleRecord = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  category: string;
  author_name: string;
  source_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
};

export type ArticleInput = Pick<
  ArticleRecord,
  "title" | "slug" | "summary" | "body" | "category" | "author_name" | "source_url"
> & { intent: "draft" | "publish" };

export type EditorState = { error: string };

export type ArticlePreview = Pick<
  ArticleRecord,
  "id" | "slug" | "title" | "summary" | "category" | "author_name" | "published_at"
>;

export type PublishedArticlePage = {
  articles: ArticlePreview[];
  count: number;
  page: number;
  totalPages: number;
};
