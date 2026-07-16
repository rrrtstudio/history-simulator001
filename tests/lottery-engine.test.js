import assert from "node:assert/strict";
import {
  drawGameFlag,
  GAME_FLAG,
  getGameFlagBonus,
  getGameFlagProbabilities,
  getGameFlagRole,
  isCherryDuplicateFlag
} from "../js/core/lottery-engine.js";
import { calculateGameFlagDelta } from "../js/core/payout-engine.js";
import { KING_DEIGO_SPEC } from "../js/specs/king-deigo-spec.js";

export default function lotteryEngineTest() {
  probabilitySplit();
  singleFlagDrawing();
  flagDeltas();
}

function probabilitySplit() {
  for (const setting of KING_DEIGO_SPEC.settings) {
    const table = getGameFlagProbabilities(KING_DEIGO_SPEC, setting);
    const byFlag = Object.fromEntries(table.map((item) => [item.flag, item.probability]));
    const totalBig = byFlag[GAME_FLAG.BIG] + byFlag[GAME_FLAG.CHERRY_BIG];
    const totalReg = byFlag[GAME_FLAG.REG] + byFlag[GAME_FLAG.CHERRY_REG];
    const totalCherry = byFlag[GAME_FLAG.CHERRY] + byFlag[GAME_FLAG.CHERRY_BIG] + byFlag[GAME_FLAG.CHERRY_REG];

    assertNear(totalBig, 1 / KING_DEIGO_SPEC.bonus.big.probability[setting]);
    assertNear(totalReg, 1 / KING_DEIGO_SPEC.bonus.reg.probability[setting]);
    assertNear(totalCherry, 1 / KING_DEIGO_SPEC.roles.find((role) => role.id === "cherry").probability);
    assertNear(byFlag[GAME_FLAG.CHERRY_BIG], totalBig * KING_DEIGO_SPEC.bonusOverlap.cherryDuplicateRate);
    assertNear(byFlag[GAME_FLAG.CHERRY_REG], totalReg * KING_DEIGO_SPEC.bonusOverlap.cherryDuplicateRate);
  }
}

function singleFlagDrawing() {
  for (const item of getGameFlagProbabilities(KING_DEIGO_SPEC, 1)) {
    const flag = drawGameFlag(KING_DEIGO_SPEC, 1, fixedRng(rollForFlag(item.flag)));
    assert.equal(flag, item.flag);
    assert.equal(typeof flag, "string");
  }
  assert.equal(drawGameFlag(KING_DEIGO_SPEC, 1, fixedRng(0.99)), GAME_FLAG.MISS);
  assert.equal(getGameFlagRole(GAME_FLAG.CHERRY_BIG), "cherry");
  assert.equal(getGameFlagBonus(GAME_FLAG.CHERRY_BIG), "big");
  assert.equal(isCherryDuplicateFlag(GAME_FLAG.CHERRY_BIG), true);
  assert.equal(isCherryDuplicateFlag(GAME_FLAG.BIG), false);
}

function flagDeltas() {
  const expected = {
    [GAME_FLAG.MISS]: -3,
    [GAME_FLAG.REPLAY]: 0,
    [GAME_FLAG.BELL]: 6,
    [GAME_FLAG.WATERMELON]: 3,
    [GAME_FLAG.CHERRY]: 1,
    [GAME_FLAG.BIG]: 257,
    [GAME_FLAG.REG]: 117,
    [GAME_FLAG.CHERRY_BIG]: 261,
    [GAME_FLAG.CHERRY_REG]: 121
  };
  for (const [flag, delta] of Object.entries(expected)) {
    assert.equal(calculateGameFlagDelta(KING_DEIGO_SPEC, flag), delta);
  }
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

function fixedRng(value) {
  return { next: () => value };
}

function assertNear(actual, expected, tolerance = 1e-12) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} !== ${expected}`);
}
