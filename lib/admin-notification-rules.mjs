export function automationHealthState(latestRun, now = new Date()) {
  if (!latestRun) return "overdue";
  const referenceTime = latestRun.completed_at || latestRun.started_at;
  const timestamp = Date.parse(referenceTime || "");
  if (!Number.isFinite(timestamp)) return "overdue";
  const minutesSinceRun = (now.getTime() - timestamp) / 60_000;
  if (latestRun.status === "running" && minutesSinceRun >= 10) return "stuck";
  const hoursSinceRun = minutesSinceRun / 60;
  if (hoursSinceRun >= 26) return "overdue";
  return "healthy";
}
