export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(year, month) {
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

export function endOfMonth(year, month) {
  return new Date(year, month, 0, 23, 59, 59, 999);
}

export function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function parseDateQuery(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function isCreatedToday(createdAt) {
  const today = startOfDay(new Date());
  const created = startOfDay(new Date(createdAt));
  return today.getTime() === created.getTime();
}
