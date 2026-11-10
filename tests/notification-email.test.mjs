import assert from "node:assert/strict";
import test from "node:test";
import { buildNotificationEmail } from "../lib/notification-email.mjs";
import { isValidNotificationEmail, shouldEmailNotification } from "../lib/notification-preferences.mjs";

test("email notification preferences validate recipients and event switches", () => {
  assert.equal(isValidNotificationEmail("editor@example.com"), true);
  assert.equal(isValidNotificationEmail("not-an-email"), false);
  assert.equal(shouldEmailNotification({
    email_enabled: true,
    recipient_email: "editor@example.com",
    notify_rss_failure: true,
  }, "rss_failure"), true);
  assert.equal(shouldEmailNotification({
    email_enabled: true,
    recipient_email: "editor@example.com",
    notify_rss_failure: false,
  }, "rss_failure"), false);
});

test("notification email escapes untrusted content and links only to the configured site", () => {
  const content = buildNotificationEmail({
    title: "Feed <failed>",
    message: "A & B",
    href: "/admin/automation",
  }, "https://aven-brief.vercel.app/");

  assert.match(content.subject, /Feed <failed>/);
  assert.match(content.html, /Feed &lt;failed&gt;/);
  assert.match(content.html, /A &amp; B/);
  assert.match(content.html, /https:\/\/aven-brief\.vercel\.app\/admin\/automation/);
});
