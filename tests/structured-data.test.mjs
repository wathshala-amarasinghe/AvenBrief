import assert from "node:assert/strict";
import test from "node:test";
import { escapeXml, serializeJsonLd } from "../lib/structured-data.mjs";

test("serializeJsonLd neutralises HTML-significant characters", () => {
  const output = serializeJsonLd({ title: "</script><script>alert('x')</script>&" });

  assert.equal(output.includes("</script>"), false);
  assert.match(output, /\\u003c\/script\\u003e/);
  assert.match(output, /\\u0026/);
});

test("escapeXml encodes RSS text and attribute characters", () => {
  assert.equal(
    escapeXml(`News & <views> "today" 'now'`),
    "News &amp; &lt;views&gt; &quot;today&quot; &apos;now&apos;",
  );
});
