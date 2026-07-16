import assert from "node:assert/strict";
import {
  createDefaultChainState,
  createDefaultRetroStats,
  expireChainIfNeeded,
  resolveBonusChain
} from "../js/core/chain-engine.js";
import { KING_DEIGO_SPEC } from "../js/specs/king-deigo-spec.js";

export default function chainEngineTest() {
  normalReg();
  normalBig();
  bigToBig();
  bigToReg();
  bigRegBig();
  renchanRegAt100();
  resetAt101Reg();
  resetAt101Big();
  fourthBigRenchan();
  fifthBigDairenchan();
  dairenchanReg();
  dairenchanExpiresAt101();
}

function normalReg() {
  const machine = createMachine();
  machine.gamesSinceBonus = 12;
  const result = resolveBonusChain({ machine, spec: KING_DEIGO_SPEC, bonusType: "reg", rng: fixedRng(0), recordPlayerRetro: true });
  assert.equal(result.bonusStatus, "normal");
  assert.equal(machine.chainState.state, "normal");
  assert.equal(machine.playerRetroStats?.total.draws || 0, 0);
}

function normalBig() {
  const machine = createMachine();
  machine.gamesSinceBonus = 33;
  const result = resolveBonusChain({ machine, spec: KING_DEIGO_SPEC, bonusType: "big", rng: fixedRng(0), recordPlayerRetro: true });
  assert.equal(result.bonusStatus, "normal");
  assert.equal(machine.chainState.state, "chain-pending");
  assert.equal(machine.chainState.chainBigCount, 1);
  assert.equal(machine.playerRetroStats?.total.draws || 0, 0);
}

function bigToBig() {
  const machine = pendingMachine();
  machine.gamesSinceBonus = 50;
  const result = resolveBonusChain({ machine, spec: KING_DEIGO_SPEC, bonusType: "big", rng: fixedRng(0), recordPlayerRetro: true });
  assert.equal(result.bonusStatus, "renchan");
  assert.equal(machine.chainState.state, "renchan");
  assert.equal(machine.chainState.chainBigCount, 2);
  assert.equal(machine.playerRetroStats.big.draws, 1);
  assert.equal(machine.playerRetroStats.big.hits, 1);
}

function bigToReg() {
  const machine = pendingMachine();
  machine.gamesSinceBonus = 50;
  const result = resolveBonusChain({ machine, spec: KING_DEIGO_SPEC, bonusType: "reg", rng: fixedRng(0), recordPlayerRetro: true });
  assert.equal(result.bonusStatus, "normal");
  assert.equal(machine.chainState.state, "chain-pending");
  assert.equal(machine.chainState.chainRegCount, 1);
  assert.equal(machine.playerRetroStats?.total.draws || 0, 0);
}

function bigRegBig() {
  const machine = pendingMachine();
  machine.gamesSinceBonus = 50;
  resolveBonusChain({ machine, spec: KING_DEIGO_SPEC, bonusType: "reg", rng: fixedRng(0), recordPlayerRetro: true });
  machine.gamesSinceBonus = 80;
  const result = resolveBonusChain({ machine, spec: KING_DEIGO_SPEC, bonusType: "big", rng: fixedRng(0.99), recordPlayerRetro: true });
  assert.equal(result.bonusStatus, "renchan");
  assert.equal(machine.chainState.chainBigCount, 2);
  assert.equal(machine.chainState.chainRegCount, 1);
  assert.equal(machine.playerRetroStats.big.draws, 1);
  assert.equal(machine.playerRetroStats.big.hits, 0);
}

function renchanRegAt100() {
  const machine = renchanMachine(2);
  machine.gamesSinceBonus = 100;
  const result = resolveBonusChain({ machine, spec: KING_DEIGO_SPEC, bonusType: "reg", rng: fixedRng(0), recordPlayerRetro: true });
  assert.equal(result.bonusStatus, "renchan");
  assert.equal(machine.chainState.state, "renchan");
  assert.equal(machine.playerRetroStats.reg.draws, 1);
}

function resetAt101Reg() {
  const machine = renchanMachine(2);
  machine.gamesSinceBonus = 101;
  const result = resolveBonusChain({ machine, spec: KING_DEIGO_SPEC, bonusType: "reg", rng: fixedRng(0), recordPlayerRetro: true });
  assert.equal(result.bonusStatus, "normal");
  assert.equal(machine.chainState.state, "normal");
  assert.equal(machine.playerRetroStats?.total.draws || 0, 0);
}

function resetAt101Big() {
  const machine = renchanMachine(2);
  machine.gamesSinceBonus = 101;
  const result = resolveBonusChain({ machine, spec: KING_DEIGO_SPEC, bonusType: "big", rng: fixedRng(0), recordPlayerRetro: true });
  assert.equal(result.bonusStatus, "normal");
  assert.equal(machine.chainState.state, "chain-pending");
  assert.equal(machine.chainState.chainBigCount, 1);
}

function fourthBigRenchan() {
  const machine = renchanMachine(3);
  machine.gamesSinceBonus = 100;
  const result = resolveBonusChain({ machine, spec: KING_DEIGO_SPEC, bonusType: "big", rng: fixedRng(0), recordPlayerRetro: true });
  assert.equal(result.bonusStatus, "renchan");
  assert.equal(machine.chainState.chainBigCount, 4);
  assert.equal(machine.playerRetroStats.big.draws, 1);
}

function fifthBigDairenchan() {
  const machine = renchanMachine(4);
  machine.gamesSinceBonus = 100;
  const result = resolveBonusChain({ machine, spec: KING_DEIGO_SPEC, bonusType: "big", rng: fixedRng(0), recordPlayerRetro: true });
  assert.equal(result.bonusStatus, "dairenchan");
  assert.equal(machine.chainState.state, "dairenchan");
  assert.equal(machine.chainState.chainBigCount, 5);
  assert.equal(machine.playerRetroStats?.total.draws || 0, 0);
}

function dairenchanReg() {
  const machine = createMachine({
    state: "dairenchan",
    chainBigCount: 5,
    chainRegCount: 0,
    chainBonusCount: 5
  });
  machine.gamesSinceBonus = 70;
  const result = resolveBonusChain({ machine, spec: KING_DEIGO_SPEC, bonusType: "reg", rng: fixedRng(0), recordPlayerRetro: true });
  assert.equal(result.bonusStatus, "dairenchan");
  assert.equal(machine.chainState.state, "dairenchan");
  assert.equal(machine.playerRetroStats?.total.draws || 0, 0);
}

function dairenchanExpiresAt101() {
  const machine = createMachine({
    state: "dairenchan",
    chainBigCount: 5,
    chainRegCount: 1,
    chainBonusCount: 6
  });
  machine.gamesSinceBonus = 101;
  const expired = expireChainIfNeeded(machine, KING_DEIGO_SPEC);
  assert.equal(expired, true);
  assert.equal(machine.chainState.state, "normal");
  assert.equal(machine.chainState.chainBigCount, 0);
}

function pendingMachine() {
  return createMachine({
    state: "chain-pending",
    chainBigCount: 1,
    chainRegCount: 0,
    chainBonusCount: 1,
    originBig: { game: 1000, difference: 0 },
    lastBonusGame: 1000,
    lastBonusType: "big"
  });
}

function renchanMachine(bigCount) {
  return createMachine({
    state: "renchan",
    chainBigCount: bigCount,
    chainRegCount: 0,
    chainBonusCount: bigCount,
    originBig: { game: 1000, difference: 0 },
    lastBonusGame: 1000,
    lastBonusType: "big"
  });
}

function createMachine(chainPatch = {}) {
  return {
    hiddenSetting: 1,
    currentTotalGames: 1000,
    currentDifference: 0,
    gamesSinceBonus: 0,
    chainState: { ...createDefaultChainState(), ...chainPatch },
    playerRetroStats: createDefaultRetroStats()
  };
}

function fixedRng(value) {
  return { next: () => value };
}
