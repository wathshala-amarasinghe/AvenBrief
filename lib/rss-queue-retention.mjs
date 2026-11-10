import { canonicalizeStoryUrl } from "./rss-story-dedup.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;

function canonicalUrl(value) {
  try {
    return canonicalizeStoryUrl(value);
  } catch {
    return null;
  }
}

/**
 * Identify recoverable queue entries that no longer need editorial attention.
 * Missing publisher dates fall back to import time so undated feeds cannot
 * remain in the active queue forever.
 *
 * @param {{
 *   stories: Array<{id: string, source_url: string, source_published_at: string | null, imported_at: string}>,
 *   existingArticleUrls?: string[],
 *   now?: string | Date,
 *   maxAgeDays?: number,
 * }} input
 */
export function findQueueRetentionCandidates({
  stories,
  existingArticleUrls = [],
  now = new Date(),
  maxAgeDays = 14,
}) {
  const parsedNow = new Date(now).getTime();
  const nowMs = Number.isFinite(parsedNow) ? parsedNow : Date.now();
  const safeAgeDays = Number.isFinite(maxAgeDays) && maxAgeDays > 0 ? maxAgeDays : 14;
  const staleBefore = nowMs - safeAgeDays * DAY_MS;
  const usedUrls = new Set(existingArticleUrls.map(canonicalUrl).filter(Boolean));
  const candidates = [];

  for (const story of stories) {
    const storyUrl = canonicalUrl(story.source_url);
    if (storyUrl && usedUrls.has(storyUrl)) {
      candidates.push({ id: story.id, reason: "source_already_used" });
      continue;
    }

    const publisherTime = Date.parse(story.source_published_at ?? "");
    const importedTime = Date.parse(story.imported_at);
    const effectiveTime = Number.isFinite(publisherTime) ? publisherTime : importedTime;
    if (Number.isFinite(effectiveTime) && effectiveTime < staleBefore) {
      candidates.push({ id: story.id, reason: "stale" });
    }
  }

  return candidates;
}

