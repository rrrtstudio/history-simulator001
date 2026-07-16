export function createRandom(seed = Date.now()) {
  let state = normalizeSeed(seed);
  return {
    next() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
    int(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick(items) {
      return items[Math.floor(this.next() * items.length)];
    }
  };
}

export function normalizeSeed(seed) {
  if (Number.isFinite(Number(seed))) return Number(seed) >>> 0;
  return String(seed).split("").reduce((hash, char) => {
    return Math.imul(31, hash) + char.charCodeAt(0) >>> 0;
  }, 2166136261);
}

export function weightedChoice(items, rng) {
  const total = items.reduce((sum, item) => sum + Math.max(0, Number(item.weight || 0)), 0);
  if (!total) return null;
  const roll = rng.next() * total;
  let cursor = 0;
  for (const item of items) {
    cursor += Math.max(0, Number(item.weight || 0));
    if (roll < cursor) return item.value;
  }
  return items[items.length - 1]?.value ?? null;
}
