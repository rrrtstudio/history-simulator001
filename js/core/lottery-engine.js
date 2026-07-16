import { getBonusRate, resolveBySetting } from "../specs/spec-interface.js";
import { weightedChoice } from "./random.js";

export const GAME_FLAG = {
  MISS: "miss",
  REPLAY: "replay",
  BELL: "bell",
  WATERMELON: "watermelon",
  CHERRY: "cherry",
  BIG: "big",
  REG: "reg",
  CHERRY_BIG: "cherry_big",
  CHERRY_REG: "cherry_reg"
};

const FLAG_ROLE = {
  [GAME_FLAG.REPLAY]: "replay",
  [GAME_FLAG.BELL]: "bell",
  [GAME_FLAG.WATERMELON]: "watermelon",
  [GAME_FLAG.CHERRY]: "cherry",
  [GAME_FLAG.CHERRY_BIG]: "cherry",
  [GAME_FLAG.CHERRY_REG]: "cherry"
};

const FLAG_BONUS = {
  [GAME_FLAG.BIG]: "big",
  [GAME_FLAG.REG]: "reg",
  [GAME_FLAG.CHERRY_BIG]: "big",
  [GAME_FLAG.CHERRY_REG]: "reg"
};

export function drawSetting(settingDistribution, vacantAdjustment, rng) {
  const items = Object.entries(settingDistribution).map(([setting, weight]) => ({
    value: Number(setting),
    weight: Number(weight || 0) * Number(vacantAdjustment?.[setting] ?? 1)
  }));
  return weightedChoice(items, rng);
}

export function drawGameFlag(spec, setting, rng) {
  const roll = rng.next();
  let cursor = 0;
  for (const item of getGameFlagProbabilities(spec, setting)) {
    cursor += item.probability;
    if (roll < cursor) return item.flag;
  }
  return GAME_FLAG.MISS;
}

export function getGameFlagProbabilities(spec, setting) {
  const bellChance = getRoleChance(spec, "bell", setting);
  const replayChance = getRoleChance(spec, "replay", setting);
  const watermelonChance = getRoleChance(spec, "watermelon", setting);
  const cherryChance = getRoleChance(spec, "cherry", setting);
  const bigChance = getBonusChance(spec, "big", setting);
  const regChance = getBonusChance(spec, "reg", setting);
  const duplicateRate = Number(spec.bonusOverlap?.cherryDuplicateRate || 0);
  const cherryBigChance = bigChance * duplicateRate;
  const cherryRegChance = regChance * duplicateRate;
  const normalCherryChance = cherryChance - cherryBigChance - cherryRegChance;

  if (normalCherryChance < -Number.EPSILON) {
    throw new Error("Cherry duplicate probabilities exceed total cherry probability");
  }

  return [
    { flag: GAME_FLAG.BELL, probability: bellChance },
    { flag: GAME_FLAG.REPLAY, probability: replayChance },
    { flag: GAME_FLAG.WATERMELON, probability: watermelonChance },
    { flag: GAME_FLAG.CHERRY, probability: Math.max(0, normalCherryChance) },
    { flag: GAME_FLAG.BIG, probability: bigChance * (1 - duplicateRate) },
    { flag: GAME_FLAG.REG, probability: regChance * (1 - duplicateRate) },
    { flag: GAME_FLAG.CHERRY_BIG, probability: cherryBigChance },
    { flag: GAME_FLAG.CHERRY_REG, probability: cherryRegChance }
  ].filter((item) => item.probability > 0);
}

export function getGameFlagRole(flag) {
  return FLAG_ROLE[flag] || null;
}

export function getGameFlagBonus(flag) {
  return FLAG_BONUS[flag] || null;
}

export function isCherryDuplicateFlag(flag) {
  return flag === GAME_FLAG.CHERRY_BIG || flag === GAME_FLAG.CHERRY_REG;
}

function getRoleChance(spec, roleId, setting) {
  const role = spec.roles.find((item) => item.id === roleId);
  const denominator = Number(resolveBySetting(role?.probability, setting));
  return denominator ? 1 / denominator : 0;
}

function getBonusChance(spec, bonusType, setting) {
  const denominator = Number(getBonusRate(spec, bonusType, setting));
  return denominator ? 1 / denominator : 0;
}

export function drawDistribution(distribution, rng) {
  if (!distribution) return null;
  const items = Object.entries(distribution).map(([value, weight]) => ({ value, weight }));
  return weightedChoice(items, rng);
}
