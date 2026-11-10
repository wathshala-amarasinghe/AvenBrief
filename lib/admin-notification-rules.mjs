export function automationHealthState(latestRun, now = new Date()) {
  if (!latestRun) return "overdue";
  const referenceTime = latestRun.completed_at || latestRun.started_at;
  const timestamp = Date.parse(referenceTime || "");
  if (!Number.isFinite(timestamp)) return "overdue";
  const hoursSinceRun = (now.getTime() - timestamp) / 3_600_000;
  if (latestRun.status === "running" && hoursSinceRun >= 1) return "stuck";
  if (hoursSinceRun >= 26) return "overdue";
  return "healthy";
}
