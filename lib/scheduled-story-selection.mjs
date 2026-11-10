import { canonicalizeStoryUrl } from "./rss-story-dedup.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_STORY_AGE_MS = 14 * DAY_MS;
const MAX_FUTURE_SKEW_MS = DAY_MS;

const SOURCE_AUTHORITY = [
  [/^UN News$/i, 60],
  [/^Carbon Brief$/i, 58],
  [/^MIT News/i, 54],
  [/^Federal Reserve Press Releases$/i, 52],
  [/^Global Voices$/i, 50],
  [/^TechCrunch$/i, 44],
  [/^Polygon$/i, 40],
  [/^Xbox Wire$/i, 34],
];

const XBOX_PROMOTIONAL_PATTERN = /\b(tips?|guide|early access|out now|available now|anniversary|season \d+|new games for)\b|next week on xbox|how a build/i;
const ROUTINE_FED_PATTERN = /announces (approval|termination)|enforcement action|applications? by/i;
const RUMOR_OR_MEME_PATTERN = /\bmemes?\b|\balleged\b.*\b(honeypot|scandal)\b/i;

function sourceAuthority(sourceName) {
  return SOURCE_AUTHORITY.find(([pattern]) => pattern.test(sourceName))?.[1] ?? 30;
}

function canonicalUrl(value) {
  try {
    return canonicalizeStoryUrl(value);
  } catch {
    return null;
  }
}

function rejectionReason(story, existingArticleUrls, nowMs) {
  const storyUrl = canonicalUrl(story.source_url);
  if (!storyUrl) return "invalid_source_url";
  if (existingArticleUrls.has(storyUrl)) return "source_already_used";

  const publishedAt = Date.parse(story.source_published_at ?? "");
  if (Number.isFinite(publishedAt)) {
    const age = nowMs - publishedAt;
    if (age > MAX_STORY_AGE_MS) return "stale";
    if (age < -MAX_FUTURE_SKEW_MS) return "future_dated";
  }

  if (story.source_name === "Xbox Wire" && XBOX_PROMOTIONAL_PATTERN.test(story.title)) {
    return "promotional_or_guide";
  }
  if (story.source_name === "Federal Reserve Press Releases" && ROUTINE_FED_PATTERN.test(story.title)) {
    return "routine_notice";
  }
  if (RUMOR_OR_MEME_PATTERN.test(story.title)) return "rumor_or_meme";

  return null;
}

function storyScore(story, nowMs) {
  const publishedAt = Date.parse(story.source_published_at ?? "");
  const ageDays = Number.isFinite(publishedAt)
    ? Math.max(0, (nowMs - publishedAt) / DAY_MS)
    : 14;
  const freshness = Math.max(0, 30 - Math.floor(ageDays * 2));
  return sourceAuthority(story.source_name) + freshness;
}

/**
 * Rank newly imported stories for private scheduled drafting.
 * Hard exclusions are returned separately so callers can archive them without
 * deleting anything. Eligible stories remain in the review queue even when
 * they are not selected during this run.
 *
 * @param {{
 *   stories: Array<{id: string, title: string, source_name: string, source_url: string, source_published_at: string | null}>,
 *   existingArticleUrls?: string[],
 *   limit?: number,
 *   now?: string | Date,
 * }} input
 */
export function rankScheduledStories({
  stories,
  existingArticleUrls = [],
  limit = 1,
  now = new Date(),
}) {
  const nowMs = new Date(now).getTime();
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  const usedUrls = new Set(existingArticleUrls.map(canonicalUrl).filter(Boolean));
  const eligible = [];
  const rejected = [];

  for (const story of stories) {
    const reason = rejectionReason(story, usedUrls, safeNow);
    if (reason) {
      rejected.push({ id: story.id, reason });
      continue;
    }

    eligible.push({
      ...story,
      score: storyScore(story, safeNow),
      publishedTime: Date.parse(story.source_published_at ?? "") || 0,
    });
  }

  eligible.sort((a, b) =>
    b.score - a.score ||
    b.publishedTime - a.publishedTime ||
    a.title.localeCompare(b.title) ||
    a.id.localeCompare(b.id)
  );

  const safeLimit = Number.isInteger(limit) ? Math.max(0, Math.min(limit, 3)) : 1;
  return {
    selectedIds: eligible.slice(0, safeLimit).map((story) => story.id),
    rejected,
    ranked: eligible.map(({ id, score }) => ({ id, score })),
  };
}

