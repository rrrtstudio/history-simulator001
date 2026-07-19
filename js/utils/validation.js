import {
  ACTIVE_SPEC_ID,
  BIG_END_FEATHER_COLORS,
  MACHINE_COUNT,
  REG_SIDE_LAMP_COLORS,
  SCHEMA_VERSION
} from "./constants.js?v=20260719-final-table-compact";
import { createCountRecord } from "./helpers.js";
import { GAME_CONFIG } from "../config/game-config.js?v=20260719-final-table-compact";
import { createDefaultChainState, createDefaultRetroStats } from "../core/chain-engine.js";
import { createDefaultBonusRoleCounts } from "../core/history-generator.js?v=20260719-final-table-compact";
import { createDefaultPlayerGraph, ensurePlayerGraph } from "../core/player-graph.js";

export function isValidGameSave(value) {
  if (!value || typeof value !== "object") return false;
  if (value.schemaVersion !== SCHEMA_VERSION) return false;
  if (value.activeSpecId !== ACTIVE_SPEC_ID) return false;
  if (!Array.isArray(value.machines) || value.machines.length !== MACHINE_COUNT) return false;
  if (!value.player || typeof value.player !== "object") return false;
  if (!Number.isFinite(Number(value.remainingGames))) return false;
  return true;
}

export function normalizeMachineIndex(index, machineCount = MACHINE_COUNT) {
  const numeric = Number(index);
  if (!Number.isFinite(numeric)) return 0;
  return ((Math.trunc(numeric) % machineCount) + machineCount) % machineCount;
}

export function migrateGameSave(value) {
  if (!value || typeof value !== "object") return null;
  if (![1, 2, 3, 4, SCHEMA_VERSION].includes(value.schemaVersion)) return null;

  const migrated = value;
  migrated.schemaVersion = SCHEMA_VERSION;
  migrated.activeSpecId = migrated.activeSpecId || ACTIVE_SPEC_ID;
  migrated.playOrder = Number(migrated.playOrder || 0);
  migrated.currentMachineIndex = normalizeMachineIndex(migrated.currentMachineIndex || 0);
  migrated.isFinished = Boolean(migrated.isFinished);
  migrated.finishReason = migrated.finishReason || migrated.endReason || null;
  migrated.endReason = migrated.endReason || migrated.finishReason || null;
  migrated.player = normalizePlayerSave(migrated.player || {});
  migrated.machines = Array.isArray(migrated.machines) ? migrated.machines : [];

  migrated.machines.forEach((machine) => normalizeMachineSave(machine));
  return migrated;
}

function normalizePlayerSave(player) {
  const defaults = createDefaultPlayerGraph();
  player.totalInCoins = Number(player.totalInCoins || 0);
  player.totalOutCoins = Number(player.totalOutCoins || 0);
  player.totalGames = Number(player.totalGames || 0);
  player.timeConsumedGames = Number(player.timeConsumedGames ?? player.totalGames ?? 0);
  player.bonusConsumedGames = Number(player.bonusConsumedGames || 0);
  player.graphPoints = Array.isArray(player.graphPoints) && player.graphPoints.length
    ? normalizeGraphPointsForSave(player.graphPoints, {
      currentTotalGames: player.totalGames,
      currentDifference: player.totalOutCoins - player.totalInCoins
    })
    : defaults.graphPoints;
  player.playSegments = Array.isArray(player.playSegments) ? player.playSegments : [];
  player.activeSegment = player.activeSegment || null;
  player.playDifference = Number(player.totalOutCoins || 0) - Number(player.totalInCoins || 0);
  ensurePlayerGraph(player);
  return player;
}

function normalizeMachineSave(machine) {
  machine.entryTimeConsumedGames = Number(machine.entryTimeConsumedGames ?? machine.entryTotalGames ?? 0);
  machine.timeConsumedGames = Number(machine.timeConsumedGames ?? machine.currentTotalGames ?? 0);
  machine.bonusConsumedGames = Number(machine.bonusConsumedGames || 0);
  machine.graphTimeIndex = Number(machine.graphTimeIndex ?? machine.timeConsumedGames ?? machine.currentTotalGames ?? 0);
  machine.graphPoints = normalizeGraphPointsForSave(machine.graphPoints, machine);
  machine.entryGraphPointCount = normalizeEntryGraphPointCount(machine);
  const normalizedBonusHistory = normalizeBonusHistoryForSave(machine);
  machine.bonusHistory = normalizedBonusHistory.history;
  machine.bonusHistoryOrder = normalizedBonusHistory.order;
  machine.gamesSinceBonus = normalizeGamesSinceBonus(machine);
  machine.playerBonusRoleCounts = createDefaultBonusRoleCounts(machine.playerBonusRoleCounts);
  machine.playerHintCounts = {
    bigEndFeather: mergeCountRecord(BIG_END_FEATHER_COLORS, machine.playerHintCounts?.bigEndFeather),
    regSideLamp: mergeCountRecord(REG_SIDE_LAMP_COLORS, machine.playerHintCounts?.regSideLamp)
  };
  machine.latestHints = {
    bigEndFeather: machine.latestHints?.bigEndFeather || null,
    regSideLamp: machine.latestHints?.regSideLamp || null
  };
  machine.chainState = {
    ...createDefaultChainState(),
    ...(machine.chainState || {})
  };
  machine.playerRetroStats = mergeRetroStats(machine.playerRetroStats);
}

function normalizeBonusHistoryForSave(machine) {
  const rawHistory = Array.isArray(machine.bonusHistory) ? machine.bonusHistory : [];
  const totalBonusCount = Math.max(
    rawHistory.length,
    Math.floor(Number(machine.currentBig || 0) + Number(machine.currentReg || 0))
  );
  const entryTotalGames = Number(machine.entryTotalGames ?? machine.currentTotalGames ?? 0);
  const normalized = rawHistory.map((history, index) => {
    const item = history && typeof history === "object" ? history : {};
    const explicitOrder = Number(item.order);
    const fallbackOrder = Math.max(1, totalBonusCount - index);
    const order = Number.isFinite(explicitOrder) && explicitOrder > 0
      ? Math.floor(explicitOrder)
      : fallbackOrder;
    const atGame = Number(item.atGame);
    const inferredPlayerBonus = Number.isFinite(atGame) && atGame > entryTotalGames;
    const isPlayerBonus = Boolean(
      item.isPlayerBonus === true ||
      item.source === "player" ||
      inferredPlayerBonus
    );

    return {
      ...item,
      order,
      isPlayerBonus,
      source: isPlayerBonus ? "player" : "entry"
    };
  }).sort((a, b) => Number(b.order || 0) - Number(a.order || 0));

  const hasPlayerBonus = normalized.some((history) => history.isPlayerBonus) ||
    Number(machine.playerBig || 0) + Number(machine.playerReg || 0) > 0;
  const limit = hasPlayerBonus
    ? Number(GAME_CONFIG.bonusHistoryLimit || 20)
    : Number(GAME_CONFIG.entryBonusHistoryLimit || 10);
  const maxOrder = Math.max(
    totalBonusCount,
    Number(machine.bonusHistoryOrder || 0),
    ...normalized.map((history) => Number(history.order || 0)),
    0
  );

  return {
    history: normalized.slice(0, limit),
    order: maxOrder
  };
}

function normalizeGamesSinceBonus(machine) {
  const existing = Number(machine.gamesSinceBonus);
  if (Number.isFinite(existing) && existing >= 0) return Math.floor(existing);

  const currentTotalGames = Math.max(0, Math.floor(Number(machine.currentTotalGames || 0)));
  const latestBonusGame = getLatestBonusGame(machine, currentTotalGames);
  if (latestBonusGame === null) return currentTotalGames;

  return Math.max(0, currentTotalGames - latestBonusGame);
}

function getLatestBonusGame(machine, currentTotalGames) {
  const candidates = [];
  const historyGame = machine.bonusHistory?.[0]?.atGame;
  const chainGame = machine.chainState?.lastBonusGame;

  if (historyGame !== null && historyGame !== undefined) candidates.push(Number(historyGame));
  if (chainGame !== null && chainGame !== undefined) candidates.push(Number(chainGame));

  const validGames = candidates.filter((game) => (
    Number.isFinite(game) && game >= 0 && game <= currentTotalGames
  ));
  if (!validGames.length) return null;
  return Math.max(...validGames.map((game) => Math.floor(game)));
}

function normalizeGraphPointsForSave(points, machine) {
  const finalGame = Number(machine.graphTimeIndex ?? machine.currentTotalGames ?? 0);
  const finalDifference = Math.round(Number(machine.currentDifference || 0));
  const safePoints = Array.isArray(points) && points.length
    ? points.map((point) => ({
      game: Math.max(0, Math.floor(Number(point.game || 0))),
      difference: Math.round(Number(point.difference || 0))
    }))
    : [{ game: finalGame, difference: finalDifference }];
  const last = safePoints[safePoints.length - 1];
  if (last.game !== finalGame || last.difference !== finalDifference) {
    safePoints.push({
      game: finalGame,
      difference: finalDifference
    });
  }
  return safePoints;
}

function normalizeEntryGraphPointCount(machine) {
  if (machine.entryGraphPointCount) return Number(machine.entryGraphPointCount);
  const entryTimeConsumedGames = Number(machine.entryTimeConsumedGames ?? machine.entryTotalGames ?? 0);
  const count = machine.graphPoints.filter((point) => point.game <= entryTimeConsumedGames).length;
  return Math.max(1, count || machine.graphPoints.length);
}

function mergeCountRecord(keys, existing) {
  const record = createCountRecord(keys);
  Object.entries(existing || {}).forEach(([key, value]) => {
    if (key in record) record[key] = Number(value || 0);
  });
  return record;
}

function mergeRetroStats(existing) {
  const defaults = createDefaultRetroStats();
  return {
    big: { ...defaults.big, ...(existing?.big || {}) },
    reg: { ...defaults.reg, ...(existing?.reg || {}) },
    total: { ...defaults.total, ...(existing?.total || {}) }
  };
}
