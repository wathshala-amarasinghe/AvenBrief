const DEFAULT_STALE_MINUTES = 10;

export function automationRecoveryCutoff(
  now = new Date(),
  staleMinutes = DEFAULT_STALE_MINUTES,
) {
  const nowMs = new Date(now).getTime();
  const safeNowMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  const safeMinutes = Number.isFinite(staleMinutes) && staleMinutes > 0
    ? staleMinutes
    : DEFAULT_STALE_MINUTES;
  return new Date(safeNowMs - safeMinutes * 60_000).toISOString();
}

export function automationRecoveryMessage({ imports, drafts, verifications }) {
  return [
    `${imports} import run${imports === 1 ? "" : "s"}`,
    `${drafts} AI draft job${drafts === 1 ? "" : "s"}`,
    `${verifications} verification job${verifications === 1 ? "" : "s"}`,
  ].join(", ");
}
