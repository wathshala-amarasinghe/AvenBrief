const baseUrl = new URL(process.env.ACCEPTANCE_BASE_URL || "https://aven-brief.vercel.app");
const failures = [];
let checks = 0;

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

async function request(path, options = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: options.redirect ?? "follow",
    headers: { "User-Agent": "AvenBrief-Acceptance-Check/1.0" },
  });
  const body = await response.text();
  return { response, body };
}

function header(result, name) {
  return result.response.headers.get(name) || "";
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

const publicPaths = [
  "/",
  "/headlines",
  "/about",
  "/contact",
  "/editorial-policy",
  "/corrections-policy",
  "/privacy",
  "/category/world",
  "/category/technology",
  "/category/climate",
  "/category/finance",
  "/category/gaming",
];

for (const path of publicPaths) {
  const result = await request(path);
  check(result.response.status === 200, `${path} returned ${result.response.status}`);
  check(/<h1[\s>]/i.test(result.body), `${path} has no primary heading`);
}

const home = await request("/");
const csp = header(home, "content-security-policy");
check(csp.includes("frame-ancestors 'none'"), "CSP does not block framing");
check(csp.includes("object-src 'none'"), "CSP does not block object plugins");
check(!csp.includes("'unsafe-eval'"), "Production CSP permits unsafe-eval");
check(header(home, "x-frame-options") === "DENY", "X-Frame-Options is not DENY");
check(header(home, "x-content-type-options") === "nosniff", "MIME sniffing protection is missing");
check(header(home, "strict-transport-security").includes("max-age="), "HSTS is missing");
check(header(home, "referrer-policy") === "strict-origin-when-cross-origin", "Referrer policy is incorrect");
check(Boolean(header(home, "permissions-policy")), "Permissions policy is missing");

const robots = await request("/robots.txt");
check(robots.response.status === 200, "robots.txt is unavailable");
check(robots.body.includes("Sitemap: https://aven-brief.vercel.app/sitemap.xml"), "robots.txt does not advertise the sitemap");
check(robots.body.includes("Disallow: /admin"), "robots.txt does not exclude admin routes");

const sitemap = await request("/sitemap.xml");
check(sitemap.response.status === 200, "sitemap.xml is unavailable");
check(header(sitemap, "content-type").includes("application/xml"), "sitemap.xml has the wrong content type");
const articleMatch = sitemap.body.match(/<loc>https:\/\/aven-brief\.vercel\.app(\/news\/[^<]+)<\/loc>/);
check(Boolean(articleMatch), "Sitemap contains no published article");

const feed = await request("/feed.xml");
check(feed.response.status === 200, "feed.xml is unavailable");
check(header(feed, "content-type").includes("application/rss+xml"), "feed.xml has the wrong content type");
const feedItem = feed.body.match(/<item>.*?<title>(.*?)<\/title>.*?<link>https:\/\/aven-brief\.vercel\.app(\/news\/[^<]+)<\/link>.*?<category>(.*?)<\/category>.*?<pubDate>(.*?)<\/pubDate>.*?<\/item>/s);
check(Boolean(feedItem), "RSS feed contains no complete published item");

if (articleMatch && feedItem) {
  const articlePath = articleMatch[1];
  const feedPath = feedItem[2];
  const title = decodeXml(feedItem[1]);
  const category = decodeXml(feedItem[3]).toLowerCase();
  check(articlePath === feedPath, "Newest sitemap and RSS article URLs do not match");

  const article = await request(articlePath);
  check(article.response.status === 200, `${articlePath} returned ${article.response.status}`);
  check(article.body.includes(title), "Article page does not contain its RSS title");
  check(article.body.includes('"NewsArticle"'), "Article page has no NewsArticle structured data");
  check(article.body.includes("application/rss+xml"), "Article page has no RSS discovery link");

  check(home.body.includes(title), "Newest published article is missing from the homepage");
  const categoryPage = await request(`/category/${category}`);
  check(categoryPage.response.status === 200, `Article category page returned ${categoryPage.response.status}`);
  check(categoryPage.body.includes(title), "Newest published article is missing from its category page");

  const searchTerm = encodeURIComponent(title.split(/\s+/).slice(0, 4).join(" "));
  const search = await request(`/search?q=${searchTerm}`);
  check(search.response.status === 200, "Search request failed");
  check(search.body.includes(title), "Published article is missing from search results");
}

const admin = await request("/admin", { redirect: "manual" });
check(!admin.body.includes("A clear view of what needs your attention today."), "Admin dashboard data is visible without a session");
check(admin.body.includes("/login") || header(admin, "location").includes("/login"), "Anonymous admin request does not lead to login");
check(header(admin, "cache-control").includes("no-store"), "Admin response may be cached");
check(header(admin, "x-robots-tag").includes("noindex"), "Admin route is indexable");

const ingest = await request("/api/news/ingest");
check(ingest.response.status === 401, `Unauthorised ingest returned ${ingest.response.status}, expected 401`);
check(header(ingest, "cache-control").includes("no-store"), "Unauthorised ingest response may be cached");
check(header(ingest, "x-robots-tag").includes("noindex"), "API route is indexable");

if (failures.length) {
  console.error(`Acceptance failed: ${failures.length} of ${checks} checks failed.`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Acceptance passed: ${checks} checks against ${baseUrl.origin}.`);
}
