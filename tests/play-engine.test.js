import assert from "node:assert/strict";
import { playRound } from "../js/core/play-engine.js";
import { GAME_FLAG, getGameFlagProbabilities } from "../js/core/lottery-engine.js";
import { KING_DEIGO_SPEC } from "../js/specs/king-deigo-spec.js";

export default function playEngineTest() {
  soloBig();
  cherryBig();
  closingNearBonus();
  nonBonusIncrementsGamesSinceBonus();
  bonusGamesConsumeTimeOnly();
  bonusHistoryGrowsFromEntryHistory();
  bonusHistoryKeepsTwentyAndDropsOldestOnTwentyFirst();
  consecutiveRoundsKeepGamePlayable();
  finishedGameDoesNotPlay();
}

function soloBig() {
  const game = createGame();
  const rng = sequenceRng([rollForFlag(GAME_FLAG.BIG), ...Array(20).fill(0.99), 0]);
  const result = playRound({ game, spec: KING_DEIGO_SPEC, rng });
  const machine = game.machines[0];

  assert.equal(result.bonus, "big");
  assert.equal(result.duplicateRole, null);
  assert.equal(result.coinDelta, 257);
  assert.equal(result.playerInDelta, 23);
  assert.equal(result.playerOutDelta, 280);
  assert.deepEqual(result.bonusDigest, { games: 20, inCoins: 20, outCoins: 280, netCoins: 260 });
  assert.equal(result.bonusNetPayout, 260);
  assert.equal(result.timeConsumedGamesDelta, 21);
  assert.equal(result.bonusConsumedGamesDelta, 20);
  assert.equal(result.remainingGames, 79);
  assert.equal(game.player.totalGames, 1);
  assert.equal(game.player.timeConsumedGames, 21);
  assert.equal(game.player.bonusConsumedGames, 20);
  assert.equal(machine.playerBig, 1);
  assert.equal(machine.currentTotalGames, 1001);
  assert.equal(machine.timeConsumedGames, 1021);
  assert.equal(machine.bonusConsumedGames, 20);
  assert.equal(machine.graphTimeIndex, 1021);
  assert.equal(machine.playerRoleCounts.cherry, 0);
  assert.equal(machine.playerBonusRoleCounts.cherryDuplicate, 0);
  assert.equal(machine.playerHintCounts.bigEndFeather.white, 1);
  assert.equal(machine.latestHints.bigEndFeather, "white");
  assert.equal(machine.graphPoints.length, 23);
  assert.ok(machine.graphPoints.some((point) => point.game === 1001 && point.difference === 97));
  assert.equal(machine.graphPoints.at(-1).game, machine.graphTimeIndex);
  assert.equal(machine.graphPoints.at(-1).difference, machine.currentDifference);
  assert.equal(machine.bonusHistory[0].payout, 260);
  assert.equal(machine.bonusHistory[0].difference, machine.currentDifference);
  assert.equal(machine.bonusHistory[0].intervalGames, 43);
  assert.equal(machine.gamesSinceBonus, 0);
  assert.deepEqual(game.player.graphPoints[0], { game: 0, difference: 0 });
  assert.equal(game.player.graphPoints.at(-1).game, game.player.totalGames);
  assert.equal(game.player.graphPoints.at(-1).difference, game.player.totalOutCoins - game.player.totalInCoins);
  assert.equal(game.player.playDifference, game.player.totalOutCoins - game.player.totalInCoins);
  assert.equal(game.player.activeSegment.machineNumber, 101);
  assert.equal(game.player.activeSegment.games, game.player.totalGames);
  assert.equal(game.player.activeSegment.endDifference, game.player.playDifference);
}

function cherryBig() {
  const game = createGame();
  const rng = sequenceRng([rollForFlag(GAME_FLAG.CHERRY_BIG), ...Array(20).fill(0.99), 0]);
  const result = playRound({ game, spec: KING_DEIGO_SPEC, rng });
  const machine = game.machines[0];

  assert.equal(result.bonus, "big");
  assert.equal(result.duplicateRole, "cherry");
  assert.equal(result.coinDelta, 261);
  assert.equal(result.playerInDelta, 23);
  assert.equal(result.playerOutDelta, 284);
  assert.equal(result.bonusNetPayout, 260);
  assert.equal(machine.playerBig, 1);
  assert.equal(machine.playerRoleCounts.cherry, 1);
  assert.equal(machine.playerBonusRoleCounts.cherryDuplicate, 1);
  assert.equal(machine.bonusHistory[0].duplicateRole, "cherry");
}

function closingNearBonus() {
  const game = createGame();
  game.remainingGames = 1;
  const rng = sequenceRng([rollForFlag(GAME_FLAG.REG), 0]);
  const result = playRound({ game, spec: KING_DEIGO_SPEC, rng });
  const machine = game.machines[0];

  assert.equal(result.bonus, "reg");
  assert.equal(result.coinDelta, 117);
  assert.deepEqual(result.bonusDigest, { games: 10, inCoins: 20, outCoins: 140, netCoins: 120 });
  assert.equal(result.bonusNetPayout, 120);
  assert.equal(result.remainingGames, 0);
  assert.equal(result.timeConsumedGamesDelta, 11);
  assert.equal(result.bonusConsumedGamesDelta, 10);
  assert.equal(game.player.totalGames, 1);
  assert.equal(game.player.timeConsumedGames, 11);
  assert.equal(machine.currentTotalGames, 1001);
  assert.equal(machine.timeConsumedGames, 1011);
  assert.equal(machine.bonusConsumedGames, 10);
  assert.equal(machine.currentReg, 1);
  assert.equal(machine.gamesSinceBonus, 0);
}

function nonBonusIncrementsGamesSinceBonus() {
  const game = createGame();
  game.player.coins = 53;
  const machine = game.machines[0];
  const before = machine.gamesSinceBonus;
  const result = playRound({ game, spec: KING_DEIGO_SPEC, rng: sequenceRng([1]) });

  assert.equal(result.bonus, null);
  assert.equal(result.gamesPlayed, 1);
  assert.equal(machine.gamesSinceBonus, before + 1);
  assert.equal(machine.currentTotalGames, 1001);
  assert.equal(machine.bonusHistory.length, 0);
}

function bonusGamesConsumeTimeOnly() {
  const game = createGame();
  const machine = game.machines[0];
  const before = {
    remainingGames: game.remainingGames,
    playerTotalGames: game.player.totalGames,
    machineTotalGames: machine.currentTotalGames,
    playerTimeConsumedGames: Number(game.player.timeConsumedGames || 0),
    machineTimeConsumedGames: Number(machine.timeConsumedGames || machine.currentTotalGames || 0)
  };
  const rng = sequenceRng([rollForFlag(GAME_FLAG.BIG), ...Array(20).fill(0.99), 0]);
  const result = playRound({ game, spec: KING_DEIGO_SPEC, rng });

  assert.equal(result.bonus, "big");
  assert.equal(result.bonusDigest.games, 20);
  assert.equal(game.remainingGames, before.remainingGames - 21);
  assert.equal(game.player.totalGames, before.playerTotalGames + 1);
  assert.equal(machine.currentTotalGames, before.machineTotalGames + 1);
  assert.equal(game.player.timeConsumedGames, before.playerTimeConsumedGames + 21);
  assert.equal(machine.timeConsumedGames, before.machineTimeConsumedGames + 21);
  assert.equal(machine.gamesSinceBonus, 0);
}

function bonusHistoryGrowsFromEntryHistory() {
  const game = createGame({
    currentBig: 5,
    currentReg: 5,
    bonusHistory: createEntryHistory(10),
    bonusHistoryOrder: 10
  });
  const machine = game.machines[0];

  playRound({
    game,
    spec: KING_DEIGO_SPEC,
    rng: sequenceRng([rollForFlag(GAME_FLAG.BIG), ...Array(20).fill(0.99), 0])
  });
  assert.equal(machine.bonusHistory.length, 11);
  assert.equal(machine.bonusHistory[0].type, "big");
  assert.equal(machine.bonusHistory[0].isPlayerBonus, true);
  assert.equal(machine.bonusHistory[0].source, "player");
  assert.equal(machine.bonusHistory[0].order, 11);
  assert.equal(machine.bonusHistory[1].order, 10);

  playRound({
    game,
    spec: KING_DEIGO_SPEC,
    rng: sequenceRng([rollForFlag(GAME_FLAG.REG), 0])
  });
  playRound({
    game,
    spec: KING_DEIGO_SPEC,
    rng: sequenceRng([rollForFlag(GAME_FLAG.BIG), ...Array(20).fill(0.99), 0])
  });

  assert.equal(machine.bonusHistory.length, 13);
  assert.deepEqual(machine.bonusHistory.slice(0, 3).map((history) => history.type), ["big", "reg", "big"]);
  assert.deepEqual(machine.bonusHistory.slice(0, 4).map((history) => history.order), [13, 12, 11, 10]);
  assert.equal(machine.bonusHistory.every((history, index, histories) => (
    index === 0 || Number(histories[index - 1].order) > Number(history.order)
  )), true);
}

function bonusHistoryKeepsTwentyAndDropsOldestOnTwentyFirst() {
  const game = createGame({
    currentBig: 10,
    currentReg: 9,
    bonusHistory: createEntryHistory(19),
    bonusHistoryOrder: 19
  });
  const machine = game.machines[0];

  playRound({
    game,
    spec: KING_DEIGO_SPEC,
    rng: sequenceRng([rollForFlag(GAME_FLAG.BIG), ...Array(20).fill(0.99), 0])
  });
  assert.equal(machine.bonusHistory.length, 20);
  assert.equal(machine.bonusHistory[0].order, 20);
  assert.equal(machine.bonusHistory.some((history) => history.order === 1), true);

  playRound({
    game,
    spec: KING_DEIGO_SPEC,
    rng: sequenceRng([rollForFlag(GAME_FLAG.REG), 0])
  });
  assert.equal(machine.bonusHistory.length, 20);
  assert.equal(machine.bonusHistory[0].order, 21);
  assert.equal(machine.bonusHistory.some((history) => history.order === 1), false);
  assert.equal(machine.bonusHistory.some((history) => history.order === 2), true);
}

function consecutiveRoundsKeepGamePlayable() {
  const game = createGame();
  const first = playRound({
    game,
    spec: KING_DEIGO_SPEC,
    rng: sequenceRng([rollForFlag(GAME_FLAG.BIG), ...Array(20).fill(0.99), 0])
  });
  const afterFirst = {
    coins: game.player.coins,
    remainingGames: game.remainingGames,
    playerTotalGames: game.player.totalGames,
    machineTotalGames: game.machines[0].currentTotalGames,
    difference: game.machines[0].currentDifference,
    historyLength: game.machines[0].bonusHistory.length
  };

  const second = playRound({
    game,
    spec: KING_DEIGO_SPEC,
    rng: sequenceRng([rollForFlag(GAME_FLAG.REG), 0])
  });

  assert.equal(first.reason, "bonus");
  assert.equal(second.reason, "bonus");
  assert.equal(game.isFinished, undefined);
  assert.equal(game.remainingGames > 0, true);
  assert.equal(game.player.coins > afterFirst.coins, true);
  assert.equal(game.remainingGames, afterFirst.remainingGames - 11);
  assert.equal(game.player.totalGames, afterFirst.playerTotalGames + 1);
  assert.equal(game.machines[0].currentTotalGames, afterFirst.machineTotalGames + 1);
  assert.equal(game.machines[0].currentDifference > afterFirst.difference, true);
  assert.equal(game.machines[0].bonusHistory.length, afterFirst.historyLength + 1);
}

function finishedGameDoesNotPlay() {
  const game = createGame();
  game.isFinished = true;
  game.finishReason = "closed";
  game.endReason = "closed";
  const before = JSON.stringify(game);
  const result = playRound({ game, spec: KING_DEIGO_SPEC, rng: sequenceRng([rollForFlag(GAME_FLAG.BIG)]) });

  assert.equal(result.reason, "no-games");
  assert.equal(result.gamesPlayed, 0);
  assert.equal(JSON.stringify(game), before);
}

function createGame(machinePatch = {}) {
  return {
    remainingGames: 100,
    currentMachineIndex: 0,
    playOrder: 0,
    player: {
      coins: 50,
      cashInvestmentYen: 0,
      cashLentCoins: 0,
      totalInCoins: 0,
      totalOutCoins: 0,
      totalGames: 0
    },
    machines: [{
      id: "machine-1",
      number: 101,
      hiddenSetting: 1,
      currentTotalGames: 1000,
      currentDifference: 100,
      currentBig: 0,
      currentReg: 0,
      gamesSinceBonus: 42,
      graphPoints: [
        { game: 0, difference: 0 },
        { game: 1000, difference: 100 }
      ],
      entryGraphPointCount: 2,
      playerGames: 0,
      playerBig: 0,
      playerReg: 0,
      playerRoleCounts: { bell: 0, replay: 0, watermelon: 0, cherry: 0 },
      playerBonusRoleCounts: { bigWatermelon: 0, cherryDuplicate: 0 },
      playerHintCounts: {
        bigEndFeather: { white: 0, blue: 0, yellow: 0, green: 0, red: 0, rainbow: 0 },
        regSideLamp: { blue: 0, yellow: 0, green: 0, red: 0, rainbow: 0 }
      },
      latestHints: { bigEndFeather: null, regSideLamp: null },
      playerInCoins: 0,
      playerOutCoins: 0,
      played: false,
      bonusHistory: [],
      bonusHistoryOrder: 0,
      ...machinePatch
    }]
  };
}

function createEntryHistory(count) {
  return Array.from({ length: count }, (_, index) => {
    const order = count - index;
    const type = order % 2 === 0 ? "reg" : "big";
    return {
      type,
      atGame: 1000 - (index + 1) * 10,
      intervalGames: 40 + index,
      payout: type === "big" ? 260 : 120,
      difference: order * 10,
      duplicateRole: null,
      hints: {},
      chain: { bonusStatus: "normal", retroHit: false },
      order,
      isPlayerBonus: false,
      source: "entry"
    };
  });
}

function rollForFlag(flag, setting = 1) {
  let cursor = 0;
  for (const item of getGameFlagProbabilities(KING_DEIGO_SPEC, setting)) {
    const start = cursor;
    cursor += item.probability;
    if (item.flag === flag) return start + item.probability / 2;
  }
  throw new Error(`Missing flag ${flag}`);
}

function sequenceRng(values) {
  let index = 0;
  return {
    next() {
      const value = values[index] ?? values[values.length - 1] ?? 0.5;
      index += 1;
      return value;
    }
  };
}
