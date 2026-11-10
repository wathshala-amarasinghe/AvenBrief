import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateVerificationResult } from "../lib/article-verification-validation.mjs";

const inboxActions = await readFile(new URL("../app/admin/inbox/actions.ts", import.meta.url), "utf8");
const draftWorkflow = await readFile(new URL("../lib/ai-draft-workflow.ts", import.meta.url), "utf8");

const supportedClaim = {
  claim: "The report describes women discussing marriage pressure online.",
  evidence: "The publisher text explicitly describes those discussions.",
  status: "supported",
};

test("a strong fully supported report is publish ready", () => {
  const result = validateVerificationResult({
    verdict: "pass",
    score: 92,
    summary: "Every material claim in the draft is supported by the supplied publisher text.",
    critical_issues: [],
    warnings: [],
    claims: [supportedClaim],
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.publishReady, true);
});

test("partial or unsupported claims block publishing", () => {
  for (const status of ["partial", "unsupported"]) {
    const result = validateVerificationResult({
      verdict: "review",
      score: 80,
      summary: "At least one material claim requires correction or stronger source support.",
      critical_issues: status === "unsupported" ? ["A material claim is unsupported."] : [],
      warnings: ["Review the highlighted claim."],
      claims: [{ ...supportedClaim, status }],
    });
    assert.equal(result.ok, true);
    assert.equal(result.value.publishReady, false);
  }
});

test("malformed verification output is rejected", () => {
  assert.equal(validateVerificationResult({ verdict: "pass", score: 101 }).ok, false);
  assert.equal(validateVerificationResult({
    verdict: "pass",
    score: 95,
    summary: "This output is missing usable claim evidence and must be rejected.",
    critical_issues: [],
    warnings: [],
    claims: [],
  }).ok, false);
});

test("AI draft creation automatically runs verification before opening the editor", () => {
  const verificationCall = "const verificationStatus = await runArticleVerification(articleId);";
  const verificationIndex = draftWorkflow.indexOf(verificationCall);
  const redirectIndex = inboxActions.indexOf(
    "redirect(`/admin/editor?id=${result.articleId}&generated=1&verification=${result.verificationStatus}`);",
  );

  assert.ok(verificationIndex > -1, "AI draft creation must run source verification");
  assert.ok(redirectIndex > -1, "the editor must receive the automatic verification result");
});
