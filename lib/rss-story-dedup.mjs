const TRACKING_PARAMETERS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref_src",
  "ref_url",
]);

export function canonicalizeStoryUrl(rawUrl) {
  const url = new URL(rawUrl);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  for (const key of Array.from(url.searchParams.keys())) {
    if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMETERS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }

  url.searchParams.sort();
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url.href;
}

export function createStoryFingerprint({ title, publishedAt }) {
  const normalizedTitle = String(title)
    .normalize("NFKD")
    .replace(/\p{Mark}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (!normalizedTitle) return null;

  const timestamp = Date.parse(String(publishedAt ?? ""));
  const day = Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString().slice(0, 10)
    : "undated";

  return `${day}:${normalizedTitle}`.slice(0, 500);
}
