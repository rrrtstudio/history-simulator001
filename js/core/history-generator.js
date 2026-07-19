import { HALL_CONFIG } from "../config/hall-config.js";
import { GAME_CONFIG } from "../config/game-config.js?v=20260719-final-table";
import { BIG_END_FEATHER_COLORS, MACHINE_COUNT, REG_SIDE_LAMP_COLORS } from "../utils/constants.js?v=20260719-final-table";
import { createCountRecord } from "../utils/helpers.js";
import { resolveBySetting } from "../specs/spec-interface.js";
import { drawDistribution, drawGameFlag, drawSetting, getGameFlagBonus, getGameFlagProbabilities, getGameFlagRole } from "./lottery-engine.js?v=20260719-final-table";
import { getBonusDigestConfig, getBonusPayout, getNormalPayout } from "./payout-engine.js?v=20260719-final-table";
import { createGraphPoint } from "./graph-data.js?v=20260719-final-table";
import { createDefaultChainState, createDefaultRetroStats, expireChainIfNeeded, resolveBonusChain } from "./chain-engine.js";

export function generateMachines({ spec, entryHour, rng, hallConfig = HALL_CONFIG, gameConfig = GAME_CONFIG }) {
  const machines = [];
  const freshBonusMachineIndex = drawMachineIndex(rng);
  for (let index = 0; index < MACHINE_COUNT; index += 1) {
    const setting = drawSetting(hallConfig.settingDistribution, hallConfig.vacantAdjustment, rng);
    const timeBudgetGames = drawEntryTotalGames(entryHour, rng, hallConfig);
    const snapshot = simulateEntryHistory(spec, setting, timeBudgetGames, rng, hallConfig, {
      bonusGapRange: index === freshBonusMachineIndex ? [0, 99] : [100, Infinity],
      historyLimit: gameConfig.entryBonusHistoryLimit
    });
    machines.push({
      id: `machine-${index + 1}`,
      number: hallConfig.machineNumberStart + index,
      specId: gameConfig.activeSpecId,
      hiddenSetting: setting,
      entryTotalGames: snapshot.totalGames,
      currentTotalGames: snapshot.totalGames,
      entryTimeConsumedGames: snapshot.timeConsumedGames,
      timeConsumedGames: snapshot.timeConsumedGames,
      bonusConsumedGames: snapshot.bonusConsumedGames,
      graphTimeIndex: snapshot.graphTimeIndex,
      entryBig: snapshot.big,
      currentBig: snapshot.big,
      entryReg: snapshot.reg,
      currentReg: snapshot.reg,
      entryDifference: snapshot.difference,
      currentDifference: snapshot.difference,
      gamesSinceBonus: snapshot.gamesSinceBonus,
      chainState: snapshot.chainState,
      graphPoints: snapshot.graphPoints,
      entryGraphPointCount: snapshot.graphPoints.length,
      playerGames: 0,
      playerBig: 0,
      playerReg: 0,
      playerRoleCounts: createCountRecord(spec.displayRoleIds),
      playerBonusRoleCounts: createDefaultBonusRoleCounts(),
      playerHintCounts: createDefaultHintCounts(),
      latestHints: { bigEndFeather: null, regSideLamp: null },
      playerRetroStats: createDefaultRetroStats(),
      playerInCoins: 0,
      playerOutCoins: 0,
      played: false,
      lastPlayedOrder: null,
      bonusHistory: snapshot.bonusHistory,
      bonusHistoryOrder: snapshot.bonusHistoryOrder
    });
  }
  return machines;
}

function drawMachineIndex(rng) {
  return drawInt(rng, 0, MACHINE_COUNT - 1);
}

function drawInt(rng, min, max) {
  if (typeof rng.int === "function") {
    return rng.int(min, max);
  }
  return min + (Math.floor((rng.next?.() ?? Math.random()) * (max - min + 1)) % (max - min + 1));
}

export function createDefaultHintCounts() {
  return {
    bigEndFeather: createCountRecord(BIG_END_FEATHER_COLORS),
    regSideLamp: createCountRecord(REG_SIDE_LAMP_COLORS)
  };
}

export function createDefaultBonusRoleCounts(existing = {}) {
  return {
    bigWatermelon: Number(existing.bigWatermelon || 0),
    cherryDuplicate: Number(existing.cherryDuplicate || 0)
  };
}

export function drawEntryTotalGames(entryHour, rng, hallConfig = HALL_CONFIG) {
  const range = hallConfig.historyGeneration.totalGamesRangeByEntryHour[entryHour] || [1000, 6000];
  return rng.int(range[0], range[1]);
}

export function simulateEntryHistory(spec, setting, timeBudgetGames, rng, hallConfig = HALL_CONFIG, options = {}) {
  const machine = {
    hiddenSetting: setting,
    currentTotalGames: 0,
    currentBig: 0,
    currentReg: 0,
    currentDifference: 0,
    gamesSinceBonus: 0,
    timeConsumedGames: 0,
    bonusConsumedGames: 0,
    graphTimeIndex: 0,
    chainState: createDefaultChainState(),
    bonusHistory: [],
    bonusHistoryOrder: 0,
    entryBonusHistoryLimit: Number(options.historyLimit || GAME_CONFIG.entryBonusHistoryLimit || 10)
  };
  const graphPoints = [createGraphPoint(0, 0)];
  const graphEvery = Math.max(1, Math.floor(timeBudgetGames / hallConfig.historyGeneration.graphCheckpoints));

  while (machine.timeConsumedGames < timeBudgetGames) {
    machine.gamesSinceBonus += 1;
    machine.currentTotalGames += 1;
    const flag = drawGameFlag(spec, setting, rng);
    const roleId = getGameFlagRole(flag);
    const bonus = getGameFlagBonus(flag);
    machine.currentDifference += getNormalPayout(spec, roleId) - spec.betPerGame;
    consumeHistoryTimeGame(machine);

    if (bonus) {
      if (bonus === "big") machine.currentBig += 1;
      if (bonus === "reg") machine.currentReg += 1;
      const chainOutcome = resolveBonusChain({ machine, spec, bonusType: bonus, rng, recordPlayerRetro: false });
      appendHistoryGraphPoint(graphPoints, machine);
      digestHistoryBonus(machine, spec, bonus, graphPoints, graphEvery, timeBudgetGames);
      recordHistoryBonus(machine, spec, bonus, chainOutcome);
      machine.gamesSinceBonus = 0;
    } else {
      expireChainIfNeeded(machine, spec);
    }

    appendHistoryGraphPointIfNeeded(graphPoints, machine, graphEvery, timeBudgetGames);
  }

  adjustEntryBonusGap(machine, spec, setting, rng, graphPoints, graphEvery, timeBudgetGames, options.bonusGapRange);
  appendHistoryGraphPoint(graphPoints, machine);
  return {
    totalGames: machine.currentTotalGames,
    timeConsumedGames: machine.timeConsumedGames,
    bonusConsumedGames: machine.bonusConsumedGames,
    graphTimeIndex: machine.graphTimeIndex,
    big: machine.currentBig,
    reg: machine.currentReg,
    difference: machine.currentDifference,
    gamesSinceBonus: machine.gamesSinceBonus,
    chainState: machine.chainState,
    graphPoints,
    bonusHistory: machine.bonusHistory,
    bonusHistoryOrder: machine.bonusHistoryOrder
  };
}

function adjustEntryBonusGap(machine, spec, setting, rng, graphPoints, graphEvery, timeBudgetGames, bonusGapRange) {
  if (!bonusGapRange) return;
  const [minGap, maxGap] = bonusGapRange;
  const currentGap = Number(machine.gamesSinceBonus || 0);

  if (currentGap < minGap) {
    consumeEntryNormalGames(machine, spec, setting, rng, graphPoints, graphEvery, timeBudgetGames, minGap - currentGap);
    return;
  }

  if (Number.isFinite(maxGap) && currentGap > maxGap) {
    digestSyntheticHistoryBonus(machine, spec, setting, rng, graphPoints, graphEvery, timeBudgetGames);
    consumeEntryNormalGames(machine, spec, setting, rng, graphPoints, graphEvery, timeBudgetGames, drawInt(rng, 0, maxGap));
  }
}

function consumeEntryNormalGames(machine, spec, setting, rng, graphPoints, graphEvery, timeBudgetGames, count) {
  for (let game = 0; game < count; game += 1) {
    machine.gamesSinceBonus += 1;
    machine.currentTotalGames += 1;
    const roleId = drawEntryNormalRoleId(spec, setting, rng);
    machine.currentDifference += getNormalPayout(spec, roleId) - spec.betPerGame;
    consumeHistoryTimeGame(machine);
    expireChainIfNeeded(machine, spec);
    appendHistoryGraphPointIfNeeded(graphPoints, machine, graphEvery, timeBudgetGames);
  }
}

function digestSyntheticHistoryBonus(machine, spec, setting, rng, graphPoints, graphEvery, timeBudgetGames) {
  const bonusType = drawEntryBonusType(spec, setting, rng);
  machine.gamesSinceBonus += 1;
  machine.currentTotalGames += 1;
  machine.currentDifference -= spec.betPerGame;
  consumeHistoryTimeGame(machine);
  if (bonusType === "big") machine.currentBig = Number(machine.currentBig || 0) + 1;
  if (bonusType === "reg") machine.currentReg = Number(machine.currentReg || 0) + 1;
  const chainOutcome = resolveBonusChain({ machine, spec, bonusType, rng, recordPlayerRetro: false });
  appendHistoryGraphPoint(graphPoints, machine);
  digestHistoryBonus(machine, spec, bonusType, graphPoints, graphEvery, timeBudgetGames);
  recordHistoryBonus(machine, spec, bonusType, chainOutcome);
  machine.gamesSinceBonus = 0;
}

function drawEntryNormalRoleId(spec, setting, rng) {
  const items = getGameFlagProbabilities(spec, setting)
    .filter((item) => !getGameFlagBonus(item.flag))
    .map((item) => ({
      roleId: getGameFlagRole(item.flag),
      probability: Number(item.probability || 0)
    }));
  const usedProbability = getGameFlagProbabilities(spec, setting)
    .reduce((sum, item) => sum + Number(item.probability || 0), 0);
  items.push({
    roleId: null,
    probability: Math.max(0, 1 - usedProbability)
  });
  const total = items.reduce((sum, item) => sum + item.probability, 0);
  let cursor = 0;
  const roll = (rng.next?.() ?? Math.random()) * total;
  for (const item of items) {
    cursor += item.probability;
    if (roll < cursor) return item.roleId;
  }
  return null;
}

function drawEntryBonusType(spec, setting, rng) {
  const bigDenominator = Number(resolveBySetting(spec.bonus?.big?.probability, setting));
  const regDenominator = Number(resolveBySetting(spec.bonus?.reg?.probability, setting));
  const bigChance = bigDenominator ? 1 / bigDenominator : 0;
  const regChance = regDenominator ? 1 / regDenominator : 0;
  const total = bigChance + regChance;
  if (!total) return "big";
  return (rng.next?.() ?? Math.random()) < bigChance / total ? "big" : "reg";
}

function recordHistoryBonus(machine, spec, bonusType, chainOutcome) {
  machine.bonusHistoryOrder = Number(machine.bonusHistoryOrder || 0) + 1;
  machine.bonusHistory.unshift({
    type: bonusType,
    atGame: machine.currentTotalGames,
    intervalGames: chainOutcome.intervalGames,
    payout: getBonusPayout(spec, bonusType),
    difference: machine.currentDifference,
    duplicateRole: null,
    hints: {},
    chain: chainOutcome,
    order: machine.bonusHistoryOrder,
    isPlayerBonus: false,
    source: "entry"
  });
  machine.bonusHistory = machine.bonusHistory.slice(0, Number(machine.entryBonusHistoryLimit || GAME_CONFIG.entryBonusHistoryLimit || 10));
}

function digestHistoryBonus(machine, spec, bonusType, graphPoints, graphEvery, timeBudgetGames) {
  const config = getBonusDigestConfig(spec, bonusType);
  for (let game = 0; game < config.games; game += 1) {
    machine.currentDifference += config.payoutPerGame - config.betPerGame;
    consumeHistoryTimeGame(machine, { isBonus: true });
    appendHistoryGraphPointIfNeeded(graphPoints, machine, graphEvery, timeBudgetGames);
  }
}

function consumeHistoryTimeGame(machine, { isBonus = false } = {}) {
  machine.timeConsumedGames += 1;
  machine.graphTimeIndex += 1;
  if (isBonus) machine.bonusConsumedGames += 1;
}

function appendHistoryGraphPointIfNeeded(graphPoints, machine, graphEvery, timeBudgetGames) {
  if (machine.graphTimeIndex % graphEvery === 0 || machine.timeConsumedGames >= timeBudgetGames) {
    appendHistoryGraphPoint(graphPoints, machine);
  }
}

function appendHistoryGraphPoint(graphPoints, machine) {
  const point = createGraphPoint(machine.graphTimeIndex, machine.currentDifference);
  const last = graphPoints[graphPoints.length - 1];
  if (last?.game === point.game) {
    last.difference = point.difference;
  } else {
    graphPoints.push(point);
  }
}

export function drawBigBonusDetails(spec, setting, rng) {
  const bigConfig = spec.bonusGame?.big;
  const details = { bigWatermelon: 0 };
  if (!bigConfig?.games || !Array.isArray(bigConfig.roles)) return details;

  const watermelon = bigConfig.roles.find((role) => role.id === "bigWatermelon");
  const denominator = Number(resolveBySetting(watermelon?.probability, setting));
  if (!denominator) return details;

  for (let game = 0; game < bigConfig.games; game += 1) {
    if (rng.next() < 1 / denominator) details.bigWatermelon += 1;
  }
  return details;
}

export function drawBonusHints(spec, setting, bonusType, rng) {
  if (bonusType === "reg") {
    const distribution = spec.hints?.regSideLamp?.rates?.[setting];
    return { regSideLamp: drawDistribution(distribution, rng), bigEndFeather: null };
  }
  const distribution = spec.hints?.bigEndFeather?.rates?.[setting];
  return { regSideLamp: null, bigEndFeather: drawDistribution(distribution, rng) };
}
