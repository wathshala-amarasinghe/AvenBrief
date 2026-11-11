const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {{
 *   article: {created_at: string, featured_image_url?: string | null, image_alt?: string | null, image_credit?: string | null},
 *   verification?: {status?: string, publish_ready?: boolean} | null,
 *   verificationCurrent?: boolean,
 *   now?: string | Date,
 * }} input
 */
export function classifyDraftReadiness({
  article,
  verification = null,
  verificationCurrent = false,
  now = new Date(),
}) {
  const nowMs = new Date(now).getTime();
  const createdMs = Date.parse(article.created_at);
  const ageDays = Number.isFinite(nowMs) && Number.isFinite(createdMs)
    ? Math.max(0, Math.floor((nowMs - createdMs) / DAY_MS))
    : 0;
  const old = ageDays >= 7;

  if (!verification) {
    return { state: "verification", reason: "Run verification", old, ageDays };
  }
  if (verification.status === "running") {
    return { state: "verification", reason: "Verification is running", old, ageDays };
  }
  if (verification.status === "failed") {
    return { state: "verification", reason: "Last verification failed", old, ageDays };
  }
  if (!verificationCurrent) {
    return { state: "verification", reason: "Article changed after verification", old, ageDays };
  }
  if (!verification.publish_ready) {
    return { state: "verification", reason: "Verification blocked publishing", old, ageDays };
  }

  const missing = [];
  if (!article.featured_image_url?.trim()) missing.push("featured image");
  if (!article.image_alt?.trim()) missing.push("alt text");
  if (!article.image_credit?.trim()) missing.push("image credit");
  if (missing.length) {
    return {
      state: "image",
      reason: `Add ${missing.join(", ")}`,
      old,
      ageDays,
    };
  }

  return { state: "ready", reason: "Ready for final review", old, ageDays };
}
