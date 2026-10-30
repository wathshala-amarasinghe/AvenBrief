export function createContentSecurityPolicy({ development = false } = {}) {
  const scripts = ["'self'", "'unsafe-inline'"];
  if (development) scripts.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    `script-src ${scripts.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel-insights.com",
    "media-src 'self' https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function createSecurityHeaders({ development = false } = {}) {
  return [
    { key: "Content-Security-Policy", value: createContentSecurityPolicy({ development }) },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
  ];
}

export function createNoIndexHeaders() {
  return [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }];
}
