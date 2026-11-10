function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildNotificationEmail(notification, siteUrl) {
  const baseUrl = new URL(siteUrl);
  const destination = notification.href
    ? new URL(notification.href, baseUrl).toString()
    : new URL("/admin/notifications", baseUrl).toString();
  const title = String(notification.title).slice(0, 160);
  const message = String(notification.message).slice(0, 1000);

  return {
    subject: `[AvenBrief] ${title}`,
    text: `${title}\n\n${message}\n\nOpen AvenBrief: ${destination}`,
    html: `<!doctype html><html><body style="margin:0;background:#f5f8fc;font-family:Arial,sans-serif;color:#10223f"><div style="max-width:620px;margin:0 auto;padding:32px 20px"><div style="background:#fff;border:1px solid #dce5f1;border-radius:12px;padding:28px"><p style="margin:0 0 12px;color:#2468dc;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">AvenBrief automation</p><h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:28px">${escapeHtml(title)}</h1><p style="margin:0 0 24px;color:#50617a;line-height:1.6">${escapeHtml(message)}</p><a href="${escapeHtml(destination)}" style="display:inline-block;border-radius:8px;background:#2468dc;color:#fff;padding:12px 18px;text-decoration:none;font-weight:600">Open in AvenBrief</a></div><p style="margin:16px 0 0;color:#718096;font-size:12px">This operational email was sent according to your AvenBrief admin notification preferences.</p></div></body></html>`,
  };
}
