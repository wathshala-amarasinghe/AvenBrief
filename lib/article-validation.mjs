/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isArticleId(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Validate every submitted value on the server, including button intent.
 * @param {Record<string, unknown>} fields
 * @returns {{ok: true, value: import("./article-types").ArticleInput} | {ok: false, error: string}}
 */
export function validateArticle(fields) {
  const text = (name) => typeof fields[name] === "string" ? fields[name].trim() : "";
  const title = text("title");
  const slug = text("slug");
  const summary = text("summary");
  const body = text("body").replace(/\r\n?/g, "\n");
  const category = text("category");
  const author_name = text("author_name");
  const intent = text("intent");
  const source = text("source_url");
  const image = text("featured_image_url");
  const image_alt = text("image_alt");
  const image_credit = text("image_credit");

  if (intent !== "draft" && intent !== "publish") {
    return { ok: false, error: "Choose Save Draft or Publish." };
  }
  if (title.length < 3 || title.length > 180) {
    return { ok: false, error: "Use a title between 3 and 180 characters." };
  }
  if (slug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false, error: "Use a URL name such as my-first-story, up to 100 characters." };
  }
  if (!["World", "Technology", "Climate", "Finance", "Gaming"].includes(category)) {
    return { ok: false, error: "Choose a supported category." };
  }
  if (summary.length > 320 || body.length > 100000 || author_name.length > 100) {
    return { ok: false, error: "Keep the summary under 321 characters, body under 100001, and author under 101." };
  }

  let source_url = null;
  if (source) {
    try {
      const url = new URL(source);
      if (
        source.length > 2048 ||
        !["https:", "http:"].includes(url.protocol) ||
        url.username || url.password
      ) {
        return { ok: false, error: "Use a public http or https source URL without login details." };
      }
      source_url = url.href;
    } catch {
      return { ok: false, error: "Enter a valid source URL or leave it empty." };
    }
  }

  let featured_image_url = null;
  if (image) {
    try {
      const url = new URL(image);
      if (image.length > 2048 || url.protocol !== "https:" || url.username || url.password) {
        return { ok: false, error: "Use a public HTTPS featured-image URL without login details." };
      }
      featured_image_url = url.href;
    } catch {
      return { ok: false, error: "Enter a valid featured-image URL or leave it empty." };
    }
  }

  if (image_alt.length > 300 || image_credit.length > 300) {
    return { ok: false, error: "Keep image alternative text and credit under 301 characters." };
  }
  if (intent === "publish" && featured_image_url && !image_alt) {
    return { ok: false, error: "Add alternative text for the featured image before publishing." };
  }

  if (intent === "publish" && (summary.length < 20 || body.length < 50 || !author_name)) {
    return { ok: false, error: "To publish, add an author, a summary of at least 20 characters, and an article of at least 50 characters." };
  }

  return {
    ok: true,
    value: { title, slug, summary, body, category, author_name, source_url, featured_image_url, image_alt, image_credit, intent },
  };
}
