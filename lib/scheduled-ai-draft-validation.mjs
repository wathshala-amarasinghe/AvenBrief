export function parseScheduledDraftLimit(value) {
  const limit = Number(value);
  return Number.isInteger(limit) && limit >= 1 && limit <= 3 ? limit : null;
}
