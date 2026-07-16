import assert from "node:assert/strict";
import { loadSavedGame, saveGame, clearSavedGame } from "../js/state/storage.js";

export default function storageTest() {
  const originalLocalStorage = globalThis.localStorage;
  const store = new Map();
  globalThis.localStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    }
  };

  try {
    const game = createSavedGame();
    saveGame(game);
    const loaded = loadSavedGame();

    assert.equal(loaded.machines[0].bonusHistory.length, 12);
    assert.equal(loaded.machines[0].bonusHistory[0].order, 12);
    assert.equal(loaded.machines[0].bonusHistory[0].isPlayerBonus, true);
    assert.equal(loaded.machines[0].bonusHistory[0].source, "player");
    assert.equal(loaded.machines[1].bonusHistory.length, 10);
    assert.equal(loaded.machines[1].bonusHistory.every((history) => history.source === "entry"), true);

    clearSavedGame();
    assert.equal(loadSavedGame(), null);
  } finally {
    if (originalLocalStorage === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = originalLocalStorage;
    }
  }
}

function createSavedGame() {
  return {
    schemaVersion: 5,
    activeSpecId: "king-deigo",
    entryHour: 22,
    maxGames: 600,
    remainingGames: 500,
    currentMachineIndex: 0,
    playOrder: 1,
    isFinished: false,
    finishReason: null,
    endReason: null,
    player: {
      coins: 120,
      totalInCoins: 30,
      totalOutCoins: 100,
      totalGames: 10
    },
    machines: Array.from({ length: 10 }, (_, index) => createMachine(index))
  };
}

function createMachine(index) {
  const bonusHistory = index === 0
    ? createBonusHistory(12, { playerCount: 2 })
    : index === 1
      ? createBonusHistory(10)
      : [];
  return {
    id: `machine-${index + 1}`,
    number: 101 + index,
    entryTotalGames: 1000,
    currentTotalGames: index === 0 ? 1100 : 1000,
    currentBig: bonusHistory.filter((history) => history.type === "big").length,
    currentReg: bonusHistory.filter((history) => history.type === "reg").length,
    currentDifference: 0,
    graphPoints: [{ game: 0, difference: 0 }, { game: 1000, difference: 0 }],
    bonusHistory,
    bonusHistoryOrder: bonusHistory.length
  };
}

function createBonusHistory(count, { playerCount = 0 } = {}) {
  return Array.from({ length: count }, (_, index) => {
    const order = count - index;
    const isPlayerBonus = index < playerCount;
    return {
      type: order % 2 === 0 ? "reg" : "big",
      atGame: isPlayerBonus ? 1100 - index : 1000 - (index + 1) * 10,
      intervalGames: 40 + index,
      difference: order * 10,
      order,
      isPlayerBonus,
      source: isPlayerBonus ? "player" : "entry"
    };
  });
}
