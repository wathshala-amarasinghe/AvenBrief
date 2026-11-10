import { sanitiseErrorMessage } from "./error-reporting.mjs";

/**
 * @param {{
 *   runs?: Array<{id: string, status?: string, started_at?: string, items_imported?: number}>,
 *   generations?: Array<{id: string, import_run_id?: string | null, inbox_id: string, article_id?: string | null, status: string, started_at: string, error?: string | null}>,
 *   articles?: Array<{id: string, title: string}>,
 *   inbox?: Array<{id: string, title: string, source_name: string}>,
 *   verifications?: Array<{article_id: string, status: string, publish_ready: boolean, error?: string | null}>,
 * }} input
 */
export function buildAutomationMonitoring({
  runs = [],
  generations = [],
  articles = [],
  inbox = [],
  verifications = [],
}) {
  const latestRun = runs[0] ?? null;
  const articleById = new Map(articles.map((article) => [article.id, article]));
  const inboxById = new Map(inbox.map((story) => [story.id, story]));
  const verificationByArticle = new Map();
  for (const verification of verifications) {
    if (!verificationByArticle.has(verification.article_id)) {
      verificationByArticle.set(verification.article_id, verification);
    }
  }

  const latestGenerations = latestRun
    ? generations.filter((generation) => generation.import_run_id === latestRun.id)
    : [];
  const verificationFor = (generation) => generation.article_id
    ? verificationByArticle.get(generation.article_id) ?? null
    : null;
  const passed = latestGenerations.filter(
    (generation) => verificationFor(generation)?.status === "completed" &&
      verificationFor(generation)?.publish_ready === true,
  ).length;
  const blocked = latestGenerations.filter((generation) => {
    const verification = verificationFor(generation);
    return verification?.status === "failed" ||
      (verification?.status === "completed" && !verification.publish_ready);
  }).length;

  const rows = generations.map((generation) => {
    const article = generation.article_id ? articleById.get(generation.article_id) : null;
    const story = inboxById.get(generation.inbox_id);
    const verification = verificationFor(generation);
    const verificationState = verification?.status === "completed"
      ? verification.publish_ready ? "passed" : "blocked"
      : verification?.status === "running"
        ? "processing"
        : verification?.status === "failed"
          ? "failed"
          : "not_started";

    return {
      id: generation.id,
      articleId: generation.article_id ?? null,
      title: article?.title || story?.title || "Untitled story",
      sourceName: story?.source_name || "Unknown source",
      draftStatus: generation.status,
      verificationState,
      startedAt: generation.started_at,
      error: generation.error || verification?.error
        ? sanitiseErrorMessage(generation.error || verification.error)
        : null,
    };
  });

  return {
    latestRun,
    summary: {
      storiesImported: latestRun?.items_imported ?? 0,
      draftsAttempted: latestGenerations.length,
      draftsCreated: latestGenerations.filter((generation) => generation.status === "succeeded").length,
      verificationPassed: passed,
      verificationBlocked: blocked,
      failures: latestGenerations.filter((generation) => generation.status === "failed").length,
      configurationProblems: rows.filter((row) =>
        row.error && /quota|api.?key|not configured|429|resource exhausted/i.test(row.error),
      ).length,
    },
    rows,
  };
}
