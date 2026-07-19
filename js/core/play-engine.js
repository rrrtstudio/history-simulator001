import { GAME_CONFIG } from "../config/game-config.js?v=20260719-final-table-compact";
import { ROUND_END_REASON } from "../utils/constants.js?v=20260719-final-table-compact";
import { drawGameFlag, getGameFlagBonus, getGameFlagRole, isCherryDuplicateFlag } from "./lottery-engine.js?v=20260719-final-table-compact";
import { getBonusDigestConfig, getBonusPayout, getNormalPayout } from "./payout-engine.js?v=20260719-final-table-compact";
import { appendMachineGraphPoint } from "./graph-data.js?v=20260719-final-table-compact";
import { calculateStopLine, ensurePlayableCoins, isInStopRange } from "./coin-engine.js";
import { createDefaultHintCounts, drawBigBonusDetails, drawBonusHints } from "./history-generator.js?v=20260719-final-table-compact";
import { expireChainIfNeeded, resolveBonusChain } from "./chain-engine.js";
import { recordPlayerGraphPoint, startPlayerSegment } from "./player-graph.js";

export function playRound({ game, spec, rng, gameConfig = GAME_CONFIG }) {
  const machine = game.machines[game.currentMachineIndex];
  const player = game.player;
  const started = {
    coins: player.coins,
    remainingGames: game.remainingGames,
    machineDifference: machine.currentDifference,
    playerInCoins: player.totalInCoins,
    playerOutCoins: player.totalOutCoins,
    machineTimeConsumedGames: Number(machine.timeConsumedGames ?? machine.currentTotalGames ?? 0),
    machineBonusConsumedGames: Number(machine.bonusConsumedGames || 0),
    playerTimeConsumedGames: Number(player.timeConsumedGames || player.totalGames || 0),
    playerBonusConsumedGames: Number(player.bonusConsumedGames || 0)
  };

  if (game.remainingGames <= 0) {
    return createRoundResult(machine, started, player, game, {
      reason: ROUND_END_REASON.NO_GAMES,
      gamesPlayed: 0,
      investment: { investedYen: 0, lentCoins: 0, beforeCoins: player.coins, afterCoins: player.coins }
    });
  }

  if (game.isFinished) {
    return createRoundResult(machine, started, player, game, {
      reason: ROUND_END_REASON.NO_GAMES,
      gamesPlayed: 0,
      investment: { investedYen: 0, lentCoins: 0, beforeCoins: player.coins, afterCoins: player.coins }
    });
  }

  ensureTimeState(machine, player);
  const investment = ensurePlayableCoins(player, spec, gameConfig);
  const stopLine = calculateStopLine(player.coins);
  let reason = ROUND_END_REASON.STOP_LINE;
  let bonus = null;
  let duplicateRole = null;
  let bonusDetails = null;
  let bonusHints = null;
  let chainOutcome = null;
  let bonusDigest = null;
  let gamesPlayed = 0;
  const roleCounts = {};

  markMachinePlayed(game, machine);
  startPlayerSegment(game, machine);

  while (game.remainingGames > 0) {
    if (player.coins < spec.betPerGame) {
      reason = ROUND_END_REASON.NO_COINS;
      break;
    }

    const flag = drawGameFlag(spec, machine.hiddenSetting, rng);
    const roleId = getGameFlagRole(flag);
    const normalPayout = getNormalPayout(spec, roleId);
    const bonusType = getGameFlagBonus(flag);

    player.coins -= spec.betPerGame;
    player.totalInCoins += spec.betPerGame;
    machine.playerInCoins += spec.betPerGame;
    machine.currentDifference -= spec.betPerGame;

    player.coins += normalPayout;
    player.totalOutCoins += normalPayout;
    machine.playerOutCoins += normalPayout;
    machine.currentDifference += normalPayout;

    consumeTimeGame(game, machine, player);
    player.totalGames += 1;
    machine.currentTotalGames += 1;
    machine.playerGames += 1;
    machine.gamesSinceBonus += 1;
    gamesPlayed += 1;

    if (roleId) {
      roleCounts[roleId] = (roleCounts[roleId] || 0) + 1;
    }
    if (roleId && machine.playerRoleCounts[roleId] !== undefined) {
      machine.playerRoleCounts[roleId] += 1;
    }

    if (bonusType) {
      bonus = bonusType;
      chainOutcome = resolveBonusChain({
        machine,
        spec,
        bonusType,
        rng,
        recordPlayerRetro: true
      });
      duplicateRole = isCherryDuplicateFlag(flag) ? "cherry" : null;
      bonusDetails = bonusType === "big" ? drawBigBonusDetails(spec, machine.hiddenSetting, rng) : {};
      bonusHints = drawBonusHints(spec, machine.hiddenSetting, bonusType, rng);
      applyBonus(machine, spec, bonusType, bonusDetails, bonusHints, chainOutcome, duplicateRole, gameConfig);
      recordGraphPoint(game, machine);
      bonusDigest = digestBonus(game, machine, player, spec, bonusType);
      syncLatestBonusHistoryDifference(machine);
      reason = ROUND_END_REASON.BONUS;
      recordGraphPoint(game, machine);
      break;
    }

    expireChainIfNeeded(machine, spec);
    const reachedClosing = game.remainingGames <= 0;
    const reachedStopLine = isInStopRange(player.coins, stopLine);
    recordGraphPoint(game, machine);

    if (reachedClosing) {
      reason = ROUND_END_REASON.CLOSING;
      break;
    }
    if (reachedStopLine) {
      reason = ROUND_END_REASON.STOP_LINE;
      break;
    }
  }

  return createRoundResult(machine, started, player, game, {
    reason,
    gamesPlayed,
    stopLine,
    bonus,
    duplicateRole,
    bonusDetails,
    bonusHints,
    chainOutcome,
    bonusDigest,
    roleCounts,
    investment
  });
}

function ensureTimeState(machine, player) {
  if (!Number.isFinite(Number(machine.timeConsumedGames))) {
    machine.timeConsumedGames = Number(machine.currentTotalGames || 0);
  }
  if (!Number.isFinite(Number(machine.bonusConsumedGames))) {
    machine.bonusConsumedGames = 0;
  }
  if (!Number.isFinite(Number(machine.graphTimeIndex))) {
    machine.graphTimeIndex = Number(machine.timeConsumedGames || machine.currentTotalGames || 0);
  }
  if (!Number.isFinite(Number(player.timeConsumedGames))) {
    player.timeConsumedGames = Number(player.totalGames || 0);
  }
  if (!Number.isFinite(Number(player.bonusConsumedGames))) {
    player.bonusConsumedGames = 0;
  }
}

function consumeTimeGame(game, machine, player, { isBonus = false } = {}) {
  game.remainingGames = Math.max(0, Number(game.remainingGames || 0) - 1);
  machine.timeConsumedGames = Number(machine.timeConsumedGames || 0) + 1;
  machine.graphTimeIndex = Number(machine.graphTimeIndex ?? machine.currentTotalGames ?? 0) + 1;
  player.timeConsumedGames = Number(player.timeConsumedGames || 0) + 1;

  if (isBonus) {
    machine.bonusConsumedGames = Number(machine.bonusConsumedGames || 0) + 1;
    player.bonusConsumedGames = Number(player.bonusConsumedGames || 0) + 1;
  }
}

function recordGraphPoint(game, machine) {
  appendMachineGraphPoint(machine);
  recordPlayerGraphPoint(game);
}

function markMachinePlayed(game, machine) {
  if (!machine.played) {
    machine.played = true;
  }
  game.playOrder += 1;
  machine.lastPlayedOrder = game.playOrder;
}

function digestBonus(game, machine, player, spec, bonusType) {
  const config = getBonusDigestConfig(spec, bonusType);
  const digest = {
    games: config.games,
    inCoins: 0,
    outCoins: 0,
    netCoins: 0
  };

  for (let gameIndex = 0; gameIndex < config.games; gameIndex += 1) {
    const bet = config.betPerGame;
    const payout = config.payoutPerGame;
    const net = payout - bet;

    player.coins += net;
    player.totalInCoins += bet;
    player.totalOutCoins += payout;
    machine.playerInCoins += bet;
    machine.playerOutCoins += payout;
    machine.currentDifference += net;

    digest.inCoins += bet;
    digest.outCoins += payout;
    digest.netCoins += net;

    consumeTimeGame(game, machine, player, { isBonus: true });
    recordGraphPoint(game, machine);
  }

  return digest;
}

function applyBonus(machine, spec, bonusType, details, hints, chainOutcome, duplicateRole, gameConfig) {
  ensureBonusRoleCounts(machine);
  const payout = getBonusPayout(spec, bonusType);
  const order = nextBonusHistoryOrder(machine);

  if (bonusType === "big") {
    machine.currentBig += 1;
    machine.playerBig += 1;
    machine.playerBonusRoleCounts.bigWatermelon += Number(details.bigWatermelon || 0);
    recordHint(machine, "bigEndFeather", hints?.bigEndFeather);
  } else {
    machine.currentReg += 1;
    machine.playerReg += 1;
    recordHint(machine, "regSideLamp", hints?.regSideLamp);
  }
  if (duplicateRole === "cherry") {
    machine.playerBonusRoleCounts.cherryDuplicate += 1;
  }

  if (!Array.isArray(machine.bonusHistory)) machine.bonusHistory = [];
  machine.bonusHistory.unshift({
    type: bonusType,
    atGame: machine.currentTotalGames,
    intervalGames: machine.gamesSinceBonus,
    payout,
    difference: machine.currentDifference,
    duplicateRole,
    hints,
    chain: chainOutcome,
    order,
    isPlayerBonus: true,
    source: "player"
  });
  machine.bonusHistoryOrder = order;
  machine.bonusHistory = machine.bonusHistory.slice(0, Number(gameConfig.bonusHistoryLimit || GAME_CONFIG.bonusHistoryLimit || 20));
  machine.gamesSinceBonus = 0;
}

function syncLatestBonusHistoryDifference(machine) {
  if (machine.bonusHistory?.[0]) {
    machine.bonusHistory[0].difference = machine.currentDifference;
  }
}

function ensureBonusRoleCounts(machine) {
  if (!machine.playerBonusRoleCounts) machine.playerBonusRoleCounts = {};
  machine.playerBonusRoleCounts.bigWatermelon = Number(machine.playerBonusRoleCounts.bigWatermelon || 0);
  machine.playerBonusRoleCounts.cherryDuplicate = Number(machine.playerBonusRoleCounts.cherryDuplicate || 0);
}

function nextBonusHistoryOrder(machine) {
  const existingOrders = Array.isArray(machine.bonusHistory)
    ? machine.bonusHistory.map((history) => Number(history.order || 0))
    : [];
  const existingMax = existingOrders.length ? Math.max(...existingOrders) : 0;
  const countBeforeBonus = Number(machine.currentBig || 0) + Number(machine.currentReg || 0);
  const currentOrder = Number(machine.bonusHistoryOrder || 0);
  const baseOrder = Math.max(existingMax, countBeforeBonus, currentOrder);
  return baseOrder + 1;
}

function recordHint(machine, hintType, color) {
  if (!color) return;
  if (!machine.playerHintCounts) {
    machine.playerHintCounts = createDefaultHintCounts();
  }
  if (!machine.latestHints) {
    machine.latestHints = { bigEndFeather: null, regSideLamp: null };
  }
  if (machine.playerHintCounts[hintType]?.[color] !== undefined) {
    machine.playerHintCounts[hintType][color] += 1;
  }
  machine.latestHints[hintType] = color;
}

function createRoundResult(machine, started, player, game, patch) {
  return {
    machineId: machine.id,
    machineNumber: machine.number,
    startCoins: started.coins,
    endCoins: player.coins,
    coinDelta: player.coins - started.coins,
    machineDifferenceDelta: machine.currentDifference - started.machineDifference,
    playerInDelta: player.totalInCoins - started.playerInCoins,
    playerOutDelta: player.totalOutCoins - started.playerOutCoins,
    timeConsumedGamesDelta: Number(machine.timeConsumedGames || 0) - started.machineTimeConsumedGames,
    bonusConsumedGamesDelta: Number(machine.bonusConsumedGames || 0) - started.machineBonusConsumedGames,
    playerTimeConsumedGamesDelta: Number(player.timeConsumedGames || 0) - started.playerTimeConsumedGames,
    playerBonusConsumedGamesDelta: Number(player.bonusConsumedGames || 0) - started.playerBonusConsumedGames,
    bonusNetPayout: patch.bonusDigest?.netCoins || 0,
    remainingGames: game.remainingGames,
    ...patch
  };
}
