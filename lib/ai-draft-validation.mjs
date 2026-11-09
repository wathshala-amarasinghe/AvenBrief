export const AI_DRAFT_CATEGORIES = [
  "World",
  "Technology",
  "Climate",
  "Finance",
  "Gaming",
];

function cleanText(value) {
  return typeof value === "string" ? value.trim().replace(/\r\n?/g, "\n") : "";
}

export function validateGeneratedDraft(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "The AI returned an invalid draft." };
  }

  if (value.can_draft !== true) {
    const reason = cleanText(value.refusal_reason);
    return {
      ok: false,
      error: reason || "The available source does not contain enough reliable information for a draft.",
    };
  }

  const title = cleanText(value.title);
  const summary = cleanText(value.summary);
  const body = cleanText(value.body);
  const category = cleanText(value.category);
  const confidence = Number(value.confidence);
  const warnings = Array.isArray(value.warnings)
    ? value.warnings
        .filter((warning) => typeof warning === "string")
        .map((warning) => warning.trim())
        .filter(Boolean)
        .slice(0, 10)
    : [];

  if (title.length < 3 || title.length > 180) {
    return { ok: false, error: "The generated title has an invalid length." };
  }
  if (summary.length < 20 || summary.length > 320) {
    return { ok: false, error: "The generated summary has an invalid length." };
  }
  if (body.length < 300 || body.length > 10000) {
    return { ok: false, error: "The generated article has an invalid length." };
  }
  if (!AI_DRAFT_CATEGORIES.includes(category)) {
    return { ok: false, error: "The AI selected an unsupported category." };
  }
  if (!Number.isInteger(confidence) || confidence < 0 || confidence > 100) {
    return { ok: false, error: "The AI returned an invalid confidence score." };
  }

  return {
    ok: true,
    value: { title, summary, body, category, confidence, warnings },
  };
}

export function sourceHtmlToText(html) {
  if (typeof html !== "string") return "";

  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|form|nav|footer|header)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<\/h[1-6]\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function createArticleSlug(title, id) {
  const base = cleanText(title)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70)
    .replace(/-$/g, "") || "story";
  const suffix = typeof id === "string" ? id.replace(/-/g, "").slice(0, 12) : "draft";
  return `${base}-${suffix}`.slice(0, 100);
}
