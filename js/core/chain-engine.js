import { BONUS_STATUS, CHAIN_STATE } from "../utils/constants.js";
import { resolveBySetting } from "../specs/spec-interface.js";

export function createDefaultChainState() {
  return {
    state: CHAIN_STATE.NORMAL,
    originBig: null,
    lastBonusGame: null,
    lastBonusType: null,
    lastBonusIntervalGames: null,
    chainBigCount: 0,
    chainRegCount: 0,
    chainBonusCount: 0,
    lastBonusStatus: BONUS_STATUS.NORMAL,
    lastRetroHit: false
  };
}

export function createDefaultRetroStats() {
  return {
    big: { draws: 0, hits: 0 },
    reg: { draws: 0, hits: 0 },
    total: { draws: 0, hits: 0 }
  };
}

export function expireChainIfNeeded(machine, spec) {
  const chain = ensureChainState(machine);
  const windowGames = getWindowGames(spec);
  if (chain.state !== CHAIN_STATE.NORMAL && Number(machine.gamesSinceBonus || 0) > windowGames) {
    resetChainState(machine);
    return true;
  }
  return false;
}

export function resolveBonusChain({ machine, spec, bonusType, rng, recordPlayerRetro = false }) {
  const intervalGames = Number(machine.gamesSinceBonus || 0);
  const windowGames = getWindowGames(spec);
  let chain = ensureChainState(machine);
  if (chain.state !== CHAIN_STATE.NORMAL && intervalGames > windowGames) {
    chain = resetChainState(machine);
  }
  const previousState = chain.state;

  let bonusStatus = BONUS_STATUS.NORMAL;
  let retroEligible = false;
  let retroHit = false;
  let enteredState = chain.state;
  let chainBigCount = Number(chain.chainBigCount || 0);
  let chainRegCount = Number(chain.chainRegCount || 0);
  let chainBonusCount = Number(chain.chainBonusCount || 0);

  if (chain.state === CHAIN_STATE.NORMAL) {
    if (bonusType === "big") {
      chainBigCount = 1;
      chainRegCount = 0;
      chainBonusCount = 1;
      enteredState = CHAIN_STATE.CHAIN_PENDING;
      chain.originBig = createOriginBig(machine);
    } else {
      enteredState = CHAIN_STATE.NORMAL;
      chainBigCount = 0;
      chainRegCount = 0;
      chainBonusCount = 0;
      chain.originBig = null;
    }
  } else if (chain.state === CHAIN_STATE.CHAIN_PENDING) {
    if (bonusType === "big") {
      chainBigCount += 1;
      chainBonusCount += 1;
      bonusStatus = chainBigCount >= getDairenchanStartBigCount(spec)
        ? BONUS_STATUS.DAIRENCHAN
        : BONUS_STATUS.RENCHAN;
      enteredState = bonusStatus === BONUS_STATUS.DAIRENCHAN
        ? CHAIN_STATE.DAIRENCHAN
        : CHAIN_STATE.RENCHAN;
      retroEligible = bonusStatus === BONUS_STATUS.RENCHAN;
    } else {
      chainRegCount += 1;
      chainBonusCount += 1;
      enteredState = CHAIN_STATE.CHAIN_PENDING;
    }
  } else if (chain.state === CHAIN_STATE.RENCHAN) {
    if (bonusType === "big") {
      chainBigCount += 1;
      chainBonusCount += 1;
      bonusStatus = chainBigCount >= getDairenchanStartBigCount(spec)
        ? BONUS_STATUS.DAIRENCHAN
        : BONUS_STATUS.RENCHAN;
      enteredState = bonusStatus === BONUS_STATUS.DAIRENCHAN
        ? CHAIN_STATE.DAIRENCHAN
        : CHAIN_STATE.RENCHAN;
      retroEligible = bonusStatus === BONUS_STATUS.RENCHAN;
    } else {
      chainRegCount += 1;
      chainBonusCount += 1;
      bonusStatus = BONUS_STATUS.RENCHAN;
      enteredState = CHAIN_STATE.RENCHAN;
      retroEligible = true;
    }
  } else if (chain.state === CHAIN_STATE.DAIRENCHAN) {
    if (bonusType === "big") chainBigCount += 1;
    else chainRegCount += 1;
    chainBonusCount += 1;
    bonusStatus = BONUS_STATUS.DAIRENCHAN;
    enteredState = CHAIN_STATE.DAIRENCHAN;
  }

  if (retroEligible) {
    const retroRate = getRetroRate(spec, machine.hiddenSetting);
    retroHit = Number.isFinite(retroRate) && rng.next() < retroRate;
    if (recordPlayerRetro) recordRetroStats(machine, bonusType, retroHit);
  }

  chain.state = enteredState;
  chain.lastBonusGame = Number(machine.currentTotalGames || 0);
  chain.lastBonusType = bonusType;
  chain.lastBonusIntervalGames = intervalGames;
  chain.chainBigCount = chainBigCount;
  chain.chainRegCount = chainRegCount;
  chain.chainBonusCount = chainBonusCount;
  chain.lastBonusStatus = bonusStatus;
  chain.lastRetroHit = retroHit;
  machine.chainState = chain;

  return {
    intervalGames,
    previousState,
    nextState: enteredState,
    bonusStatus,
    isRenchan: bonusStatus === BONUS_STATUS.RENCHAN,
    isDairenchan: bonusStatus === BONUS_STATUS.DAIRENCHAN,
    retroEligible,
    retroHit,
    chainBigCount,
    chainRegCount,
    chainBonusCount
  };
}

export function ensureChainState(machine) {
  if (!machine.chainState) {
    machine.chainState = createDefaultChainState();
  }
  machine.chainState = {
    ...createDefaultChainState(),
    ...machine.chainState
  };
  return machine.chainState;
}

export function ensureRetroStats(machine) {
  if (!machine.playerRetroStats) {
    machine.playerRetroStats = createDefaultRetroStats();
  }
  machine.playerRetroStats = {
    big: { ...createDefaultRetroStats().big, ...machine.playerRetroStats.big },
    reg: { ...createDefaultRetroStats().reg, ...machine.playerRetroStats.reg },
    total: { ...createDefaultRetroStats().total, ...machine.playerRetroStats.total }
  };
  return machine.playerRetroStats;
}

function resetChainState(machine) {
  machine.chainState = createDefaultChainState();
  return machine.chainState;
}

function createOriginBig(machine) {
  return {
    game: Number(machine.currentTotalGames || 0),
    difference: Number(machine.currentDifference || 0)
  };
}

function getWindowGames(spec) {
  return Number(spec.renchan?.windowGames || 100);
}

function getDairenchanStartBigCount(spec) {
  return Number(spec.renchan?.dairenchanStartBigCount || 5);
}

function getRetroRate(spec, setting) {
  const rate = resolveBySetting(spec.renchan?.retroRates, setting);
  return rate === null || rate === undefined ? null : Number(rate);
}

function recordRetroStats(machine, bonusType, retroHit) {
  const stats = ensureRetroStats(machine);
  const key = bonusType === "big" ? "big" : "reg";
  stats[key].draws += 1;
  stats.total.draws += 1;
  if (retroHit) {
    stats[key].hits += 1;
    stats.total.hits += 1;
  }
}
