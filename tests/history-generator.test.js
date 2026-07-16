import assert from "node:assert/strict";
import { createRandom } from "../js/core/random.js";
import { generateMachines } from "../js/core/history-generator.js";
import { KING_DEIGO_SPEC } from "../js/specs/king-deigo-spec.js";

export default function historyGeneratorTest() {
  const first = generateMachines({ spec: KING_DEIGO_SPEC, entryHour: 20, rng: createRandom(1234) });
  const second = generateMachines({ spec: KING_DEIGO_SPEC, entryHour: 20, rng: createRandom(1234) });

  assert.equal(first.length, 10);
  assert.deepEqual(first[0], second[0]);
  assert.equal(first.every((machine) => machine.specId === "king-deigo"), true);
  assert.equal(first.every((machine) => machine.playerGames === 0), true);
  assert.equal(first.every((machine) => machine.entryTotalGames === machine.currentTotalGames), true);
  assert.equal(first.every((machine) => machine.timeConsumedGames >= machine.currentTotalGames), true);
  assert.equal(first.every((machine) => machine.bonusHistory.length <= 10), true);
  assert.equal(first.every((machine) => Number.isFinite(machine.bonusHistoryOrder)), true);
  assert.equal(first.every((machine) => machine.bonusHistory.every((history) => history.isPlayerBonus === false)), true);
  assert.equal(first.every((machine) => machine.bonusHistory.every((history) => history.source === "entry")), true);
  assert.equal(first.every((machine) => isHistoryNewestFirst(machine.bonusHistory)), true);
  assert.equal(first.every((machine) => Number.isFinite(machine.gamesSinceBonus)), true);
  assert.equal(first.every((machine) => machine.gamesSinceBonus >= 0), true);
  assert.equal(first.every((machine) => machine.gamesSinceBonus <= machine.currentTotalGames), true);
  assert.equal(first.filter((machine) => machine.gamesSinceBonus < 100).length, 1);
  assert.equal(first.filter((machine) => machine.gamesSinceBonus >= 100).length, 9);
  assert.equal(first.every((machine) => isBonusGapConsistent(machine)), true);
  assert.equal(first.every((machine) => machine.graphTimeIndex === machine.timeConsumedGames), true);
  assert.equal(first.every((machine) => machine.graphPoints.at(-1).game === machine.graphTimeIndex), true);
  assert.equal(first.every((machine) => machine.graphPoints.at(-1).difference === machine.currentDifference), true);
}

function isHistoryNewestFirst(history) {
  return history.every((item, index) => {
    if (index === 0) return true;
    return Number(history[index - 1].order) > Number(item.order);
  });
}

function isBonusGapConsistent(machine) {
  const latestBonus = machine.bonusHistory[0];
  if (!latestBonus) {
    return machine.currentBig + machine.currentReg === 0
      ? machine.gamesSinceBonus === machine.currentTotalGames
      : machine.gamesSinceBonus >= 100;
  }
  return machine.currentTotalGames - latestBonus.atGame === machine.gamesSinceBonus;
}
