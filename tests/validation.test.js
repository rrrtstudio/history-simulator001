import assert from "node:assert/strict";
import { migrateGameSave, isValidGameSave } from "../js/utils/validation.js";

export default function validationTest() {
  const migrated = migrateGameSave(createLegacySave(1));

  assert.equal(isValidGameSave(migrated), true);
  assert.equal(migrated.schemaVersion, 5);
  assert.equal(migrated.machines[0].entryGraphPointCount, 2);
  assert.equal(migrated.machines[0].entryTimeConsumedGames, 1000);
  assert.equal(migrated.machines[0].timeConsumedGames, 1000);
  assert.equal(migrated.machines[0].bonusConsumedGames, 0);
  assert.equal(migrated.machines[0].graphTimeIndex, 1000);
  assert.equal(migrated.machines[0].gamesSinceBonus, 1000);
  assert.equal(migrated.machines[0].playerBonusRoleCounts.cherryDuplicate, 0);
  assert.equal(migrated.machines[0].playerHintCounts.bigEndFeather.white, 0);
  assert.equal(migrated.machines[0].chainState.state, "normal");
  assert.equal(migrated.machines[0].playerRetroStats.total.draws, 0);
  assert.deepEqual(migrated.player.graphPoints[0], { game: 0, difference: 0 });
  assert.equal(migrated.player.timeConsumedGames, 0);
  assert.equal(migrated.player.bonusConsumedGames, 0);
  assert.equal(migrated.player.playDifference, 0);
  assert.deepEqual(migrated.player.playSegments, []);
  assert.equal(migrated.isFinished, false);
  assert.equal(migrated.finishReason, null);
  assert.equal(migrated.endReason, null);

  const previousVersion = migrateGameSave(createLegacySave(3));
  assert.equal(isValidGameSave(previousVersion), true);
  assert.equal(previousVersion.schemaVersion, 5);

  const schemaFour = migrateGameSave(createLegacySave(4));
  assert.equal(isValidGameSave(schemaFour), true);
  assert.equal(schemaFour.schemaVersion, 5);

  const finished = migrateGameSave({
    ...createLegacySave(4),
    isFinished: true,
    finishReason: "retired",
    currentMachineIndex: 12
  });
  assert.equal(isValidGameSave(finished), true);
  assert.equal(finished.isFinished, true);
  assert.equal(finished.finishReason, "retired");
  assert.equal(finished.endReason, "retired");
  assert.equal(finished.currentMachineIndex, 2);

  const derivedFromBonusHistory = migrateGameSave({
    ...createLegacySave(5),
    machines: createLegacySave(5).machines.map((machine, index) => index === 0
      ? {
        ...machine,
        currentTotalGames: 1200,
        bonusHistory: [{ type: "big", atGame: 1001 }]
      }
      : machine)
  });
  assert.equal(derivedFromBonusHistory.machines[0].gamesSinceBonus, 199);

  const existingGamesSinceBonus = migrateGameSave({
    ...createLegacySave(5),
    machines: createLegacySave(5).machines.map((machine, index) => index === 0
      ? { ...machine, gamesSinceBonus: 184 }
      : machine)
  });
  assert.equal(existingGamesSinceBonus.machines[0].gamesSinceBonus, 184);

  const unplayedLongHistory = migrateGameSave({
    ...createLegacySave(5),
    machines: createLegacySave(5).machines.map((machine, index) => index === 0
      ? {
        ...machine,
        currentBig: 15,
        currentReg: 15,
        bonusHistory: createLegacyBonusHistory(30)
      }
      : machine)
  });
  assert.equal(unplayedLongHistory.machines[0].bonusHistory.length, 10);
  assert.equal(unplayedLongHistory.machines[0].bonusHistory[0].order, 30);
  assert.equal(unplayedLongHistory.machines[0].bonusHistory.at(-1).order, 21);
  assert.equal(unplayedLongHistory.machines[0].bonusHistory.every((history) => history.source === "entry"), true);
  assert.equal(unplayedLongHistory.machines[0].bonusHistoryOrder, 30);
  assert.equal(unplayedLongHistory.machines[0].currentBig, 15);
  assert.equal(unplayedLongHistory.machines[0].currentReg, 15);

  const playedLongHistory = migrateGameSave({
    ...createLegacySave(5),
    machines: createLegacySave(5).machines.map((machine, index) => index === 0
      ? {
        ...machine,
        entryTotalGames: 1000,
        currentTotalGames: 1400,
        currentBig: 16,
        currentReg: 14,
        playerBig: 2,
        playerReg: 1,
        bonusHistory: createLegacyBonusHistory(30, { playerCount: 3 })
      }
      : machine)
  });
  assert.equal(playedLongHistory.machines[0].bonusHistory.length, 20);
  assert.equal(playedLongHistory.machines[0].bonusHistory[0].isPlayerBonus, true);
  assert.equal(playedLongHistory.machines[0].bonusHistory[0].source, "player");
  assert.equal(playedLongHistory.machines[0].bonusHistory.at(-1).order, 11);
  assert.equal(playedLongHistory.machines[0].bonusHistoryOrder, 30);
}

function createLegacySave(schemaVersion) {
  return {
    schemaVersion,
    activeSpecId: "king-deigo",
    entryHour: 20,
    maxGames: 1925,
    remainingGames: 1900,
    currentMachineIndex: 0,
    player: {},
    machines: Array.from({ length: 10 }, (_, index) => ({
      id: `machine-${index + 1}`,
      number: 101 + index,
      entryTotalGames: 1000,
      currentTotalGames: 1000,
      currentDifference: 0,
      graphPoints: [{ game: 0, difference: 0 }, { game: 1000, difference: 0 }]
    }))
  };
}

function createLegacyBonusHistory(count, { playerCount = 0 } = {}) {
  return Array.from({ length: count }, (_, index) => {
    const order = count - index;
    return {
      type: order % 2 === 0 ? "reg" : "big",
      atGame: index < playerCount ? 1300 - index : 1000 - (index + 1) * 10,
      intervalGames: 30 + index,
      difference: order * 10
    };
  });
}
