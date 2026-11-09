const DAY_MS = 24 * 60 * 60 * 1000;
const CATEGORY_ORDER = ["World", "Technology", "Climate", "Finance", "Gaming"];

function dateKey(value) {
  const timestamp = Date.parse(String(value ?? ""));
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString().slice(0, 10)
    : null;
}

function timestamp(value) {
  const parsed = Date.parse(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * @param {{
 *   articles?: Array<{id: string, status: string, category: string, published_at: string | null, created_at?: string}>,
 *   inbox?: Array<{id: string, title?: string, status: string, source_name: string, source_published_at: string | null, imported_at: string, article_id: string | null, suggested_category: string | null}>,
 *   sources?: Array<{name: string, default_category: string, enabled: boolean, last_error: string | null, last_success_at: string | null}>,
 *   sourceRuns?: Array<{source_name: string, status: string, started_at?: string}>,
 *   now?: Date,
 * }} input
 */
export function buildEditorialAnalytics({
  articles = [],
  inbox = [],
  sources = [],
  sourceRuns = [],
  now = new Date(),
}) {
  const nowTime = now.getTime();
  const today = now.toISOString().slice(0, 10);
  const published = articles.filter((article) => article.status === "published");
  const articleStatus = new Map(
    articles.map((article) => [article.id, article.status]),
  );

  const daily = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(nowTime - (6 - index) * DAY_MS)
      .toISOString()
      .slice(0, 10);
    return {
      day,
      published: published.filter((article) => dateKey(article.published_at) === day)
        .length,
    };
  });

  const categories = CATEGORY_ORDER.map((category) => ({
    category,
    published: published.filter((article) => article.category === category).length,
  }));

  const allSourceNames = new Set([
    ...sources.map((source) => source.name),
    ...inbox.map((story) => story.source_name),
  ]);

  const sourceMetrics = Array.from(allSourceNames, (name) => {
    const source = sources.find((item) => item.name === name);
    const stories = inbox.filter((story) => story.source_name === name);
    const runs = sourceRuns.filter((run) => run.source_name === name);
    const drafted = stories.filter((story) => story.article_id).length;
    const publishedCount = stories.filter(
      (story) => story.article_id && articleStatus.get(story.article_id) === "published",
    ).length;
    const successfulRuns = runs.filter((run) => run.status === "succeeded").length;

    return {
      name,
      category: source?.default_category ?? "Unassigned",
      enabled: source?.enabled ?? false,
      health: source?.last_error
        ? "error"
        : source?.last_success_at
          ? "healthy"
          : "unchecked",
      imported: stories.length,
      drafted,
      published: publishedCount,
      conversionRate: stories.length
        ? Math.round((publishedCount / stories.length) * 100)
        : 0,
      successfulRuns,
      failedRuns: runs.length - successfulRuns,
      successRate: runs.length
        ? Math.round((successfulRuns / runs.length) * 100)
        : null,
    };
  }).sort((first, second) => second.imported - first.imported || first.name.localeCompare(second.name));

  const oldestQueue = inbox
    .filter((story) => story.status === "new")
    .map((story) => {
      const storyTime = timestamp(story.source_published_at) ??
        timestamp(story.imported_at) ?? nowTime;
      return {
        ...story,
        ageDays: Math.max(0, Math.floor((nowTime - storyTime) / DAY_MS)),
        sortTime: storyTime,
      };
    })
    .sort((first, second) => first.sortTime - second.sortTime)
    .slice(0, 10);

  return {
    summary: {
      publishedTotal: published.length,
      publishedToday: published.filter(
        (article) => dateKey(article.published_at) === today,
      ).length,
      imported: inbox.length,
      awaitingReview: inbox.filter((story) => story.status === "new").length,
      reviewed: inbox.filter((story) => story.status === "reviewed").length,
      archived: inbox.filter((story) => story.status === "archived").length,
      drafted: inbox.filter((story) => story.article_id).length,
      publishedFromFeeds: inbox.filter(
        (story) => story.article_id && articleStatus.get(story.article_id) === "published",
      ).length,
    },
    daily,
    categories,
    sourceMetrics,
    oldestQueue,
  };
}
