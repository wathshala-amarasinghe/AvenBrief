const VERDICTS = new Set(["pass", "review", "fail"]);
const CLAIM_STATUSES = new Set(["supported", "partial", "unsupported"]);

function cleanStrings(value, maximum) {
  if (!Array.isArray(value)) return null;
  const strings = value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maximum);
  return strings.length === value.length ? strings : null;
}

export function validateVerificationResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Verification output is not an object." };
  }

  const verdict = typeof value.verdict === "string" ? value.verdict : "";
  const score = value.score;
  const summary = typeof value.summary === "string" ? value.summary.trim() : "";
  const criticalIssues = cleanStrings(value.critical_issues, 10);
  const warnings = cleanStrings(value.warnings, 15);
  const claims = Array.isArray(value.claims)
    ? value.claims.slice(0, 30).map((claim) => {
        if (!claim || typeof claim !== "object" || Array.isArray(claim)) return null;
        const text = typeof claim.claim === "string" ? claim.claim.trim() : "";
        const evidence = typeof claim.evidence === "string" ? claim.evidence.trim() : "";
        const status = typeof claim.status === "string" ? claim.status : "";
        if (!text || !evidence || !CLAIM_STATUSES.has(status)) return null;
        return { claim: text.slice(0, 600), evidence: evidence.slice(0, 1000), status };
      })
    : null;

  if (!VERDICTS.has(verdict)) return { ok: false, error: "Verification verdict is invalid." };
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    return { ok: false, error: "Verification score is invalid." };
  }
  if (summary.length < 20 || summary.length > 1000) {
    return { ok: false, error: "Verification summary is invalid." };
  }
  if (!criticalIssues || !warnings || !claims || !claims.length || claims.some((claim) => !claim)) {
    return { ok: false, error: "Verification findings are incomplete." };
  }

  const normalizedClaims = claims;
  const publishReady = verdict === "pass" && score >= 85 && criticalIssues.length === 0 &&
    normalizedClaims.every((claim) => claim.status === "supported");

  return {
    ok: true,
    value: {
      verdict,
      score,
      summary,
      criticalIssues,
      warnings,
      claims: normalizedClaims,
      publishReady,
    },
  };
}
