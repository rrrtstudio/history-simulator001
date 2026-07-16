import { getBonusPayoutValue, getRole } from "../specs/spec-interface.js";
import { getGameFlagBonus, getGameFlagRole } from "./lottery-engine.js?v=20260716-pages-ready";

export function getNormalPayout(spec, roleId) {
  const role = getRole(spec, roleId);
  if (!role) return 0;
  if (role.isReplay) return spec.betPerGame;
  return Number(role.payout || 0);
}

export function getBonusPayout(spec, bonusType) {
  return getBonusPayoutValue(spec, bonusType);
}

export function getBonusDigestConfig(spec, bonusType) {
  const config = spec.bonusGame?.[bonusType] || {};
  return {
    games: Math.max(0, Math.floor(Number(config.games || 0))),
    betPerGame: Math.max(0, Number(config.betPerGame || 0)),
    payoutPerGame: Math.max(0, Number(config.payoutPerGame || 0))
  };
}

export function getBonusNetPayout(spec, bonusType) {
  const config = getBonusDigestConfig(spec, bonusType);
  return (config.payoutPerGame - config.betPerGame) * config.games;
}

export function calculateGameDelta(spec, roleId) {
  return getNormalPayout(spec, roleId) - spec.betPerGame;
}

export function getGameFlagPayout(spec, flag) {
  return getNormalPayout(spec, getGameFlagRole(flag)) + getBonusPayout(spec, getGameFlagBonus(flag));
}

export function calculateGameFlagDelta(spec, flag) {
  return getGameFlagPayout(spec, flag) - spec.betPerGame;
}
