export function formatNumber(value) {
  return new Intl.NumberFormat("ja-JP").format(Math.round(Number(value || 0)));
}

export function formatCoins(value) {
  return `${formatNumber(value)}枚`;
}

export function formatYen(value) {
  return `${formatNumber(value)}円`;
}

export function formatSignedCoins(value) {
  const numeric = Math.round(Number(value || 0));
  if (numeric > 0) return `+${formatNumber(numeric)}枚`;
  if (numeric < 0) return `-${formatNumber(Math.abs(numeric))}枚`;
  return "±0枚";
}

export function formatSignedYen(value) {
  const numeric = Math.round(Number(value || 0));
  if (numeric > 0) return `+${formatNumber(numeric)}円`;
  if (numeric < 0) return `-${formatNumber(Math.abs(numeric))}円`;
  return "±0円";
}

export function formatBonusRate(count, totalGames) {
  const hits = Number(count || 0);
  const games = Number(totalGames || 0);
  if (!hits || !games) return "-";
  return `1/${(games / hits).toFixed(1)}`;
}

export function formatObservedRate(totalGames, count) {
  const hits = Number(count || 0);
  const games = Number(totalGames || 0);
  if (!hits || !games) return "---";
  return `1/${(games / hits).toFixed(1)}`;
}

export function formatPayoutRate(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return `${Number(value).toFixed(1)}%`;
}

export function bonusLabel(type) {
  if (type === "big") return "BIG";
  if (type === "reg") return "REG";
  return "-";
}

export function roleLabel(spec, roleId) {
  return spec.roles.find((role) => role.id === roleId)?.label || roleId;
}
