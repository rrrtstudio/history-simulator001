export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createId(prefix = "game") {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function sumValues(record = {}) {
  return Object.values(record).reduce((sum, value) => sum + Number(value || 0), 0);
}

export function safeDivide(numerator, denominator) {
  const bottom = Number(denominator);
  if (!bottom) return null;
  return Number(numerator) / bottom;
}

export function createCountRecord(keys) {
  return Object.fromEntries(keys.map((key) => [key, 0]));
}
