export function validateSpec(spec) {
  const required = ["id", "displayName", "settings", "betPerGame", "roles", "bonus"];
  for (const key of required) {
    if (spec[key] === undefined || spec[key] === null) {
      throw new Error(`Spec is missing ${key}`);
    }
  }
  if (!Array.isArray(spec.settings) || spec.settings.length === 0) {
    throw new Error("Spec settings must be a non-empty array");
  }
  if (!Array.isArray(spec.roles)) {
    throw new Error("Spec roles must be an array");
  }
  return spec;
}

export function resolveBySetting(value, setting) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value[setting] ?? value[String(setting)] ?? null;
  }
  return value;
}

export function getRole(spec, roleId) {
  return spec.roles.find((role) => role.id === roleId) || null;
}

export function getBonusRate(spec, bonusType, setting) {
  const bonus = spec.bonus?.[bonusType];
  if (!bonus) return null;
  return resolveBySetting(bonus.probability, setting);
}

export function getBonusPayoutValue(spec, bonusType) {
  return Number(spec.bonus?.[bonusType]?.payout || 0);
}
