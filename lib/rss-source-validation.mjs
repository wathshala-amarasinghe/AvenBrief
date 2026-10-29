export const RSS_SOURCE_CATEGORIES = [
  "World",
  "Technology",
  "Climate",
  "Finance",
  "Gaming",
];

function isUnsafeHostname(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host === "::" ||
    host === "::1"
  ) {
    return true;
  }

  const parts = host.split(".");
  if (parts.length === 4 && parts.every((part) => /^\d+$/.test(part))) {
    const octets = parts.map(Number);
    if (octets.some((octet) => octet < 0 || octet > 255)) return true;

    return octets[0] === 10 ||
      octets[0] === 127 ||
      octets[0] === 0 ||
      (octets[0] === 169 && octets[1] === 254) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168) ||
      (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127) ||
      octets[0] >= 224;
  }

  return host.startsWith("fc") ||
    host.startsWith("fd") ||
    /^fe[89ab]/.test(host);
}

/**
 * @param {Record<string, unknown>} fields
 * @returns {{ok: true, value: {name: string, feed_url: string, default_category: string, enabled: boolean}} | {ok: false, error: string}}
 */
export function validateRssSource(fields) {
  const name = typeof fields.name === "string" ? fields.name.trim() : "";
  const rawUrl = typeof fields.feed_url === "string" ? fields.feed_url.trim() : "";
  const defaultCategory = typeof fields.default_category === "string"
    ? fields.default_category.trim()
    : "";

  if (name.length < 2 || name.length > 100) {
    return { ok: false, error: "Use a source name between 2 and 100 characters." };
  }

  if (!RSS_SOURCE_CATEGORIES.includes(defaultCategory)) {
    return { ok: false, error: "Choose a supported default category." };
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, error: "Enter a valid HTTPS feed URL." };
  }

  if (
    rawUrl.length > 2048 ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    isUnsafeHostname(url.hostname)
  ) {
    return {
      ok: false,
      error: "Use a public HTTPS feed URL without credentials or a custom port.",
    };
  }

  url.hash = "";

  return {
    ok: true,
    value: {
      name,
      feed_url: url.href,
      default_category: defaultCategory,
      enabled: fields.enabled === "on" || fields.enabled === "true",
    },
  };
}
