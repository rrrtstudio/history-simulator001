import assert from "node:assert/strict";
import { renderFinalResultScreen } from "../js/ui/final-result-screen.js";

export default function finalResultScreenTest() {
  let replayed = false;
  let exited = false;
  let viewedMachines = false;
  const root = createRoot();

  renderFinalResultScreen({
    root,
    game: createFinishedGame(),
    onReplay() {
      replayed = true;
    },
    onExit() {
      exited = true;
    },
    onViewMachines() {
      viewedMachines = true;
    }
  });

  assert.equal(root.innerHTML.includes("もう一度遊ぶ"), true);
  assert.equal(root.innerHTML.includes("終了"), true);
  assert.equal(root.innerHTML.includes("各台を見る"), true);
  assert.equal(root.innerHTML.includes("BIG確率"), true);
  assert.equal(root.innerHTML.includes("REG確率"), true);
  assert.equal(root.innerHTML.includes("final-summary-grid"), true);
  assert.equal(root.innerHTML.includes("ボーナス後"), false);

  root.listeners["[data-action='view-machines']"]();
  root.listeners["[data-action='replay']"]();
  root.listeners["[data-action='end']"]();
  assert.equal(viewedMachines, true);
  assert.equal(replayed, true);
  assert.equal(exited, true);
}

function createRoot() {
  globalThis.window = { scrollTo() {} };
  return {
    dataset: {},
    innerHTML: "",
    listeners: {},
    querySelector(selector) {
      if (selector === "[data-player-graph]") return null;
      return {
        addEventListener: (_eventName, handler) => {
          this.listeners[selector] = handler;
        }
      };
    }
  };
}

function createFinishedGame() {
  return {
    isFinished: true,
    finishReason: "closed",
    endReason: "closed",
    entryHour: 20,
    maxGames: 1925,
    remainingGames: 0,
    player: {
      coins: 100,
      cashInvestmentYen: 1000,
      cashLentCoins: 50,
      totalInCoins: 30,
      totalOutCoins: 120,
      totalGames: 10,
      graphPoints: [{ game: 0, difference: 0 }, { game: 10, difference: 90 }],
      playSegments: []
    },
    machines: [{
      number: 101,
      hiddenSetting: 4,
      currentTotalGames: 1000,
      currentBig: 5,
      currentReg: 3,
      currentDifference: 250,
      played: true,
      playerGames: 10,
      playerBig: 1,
      playerReg: 0,
      playerInCoins: 30,
      playerOutCoins: 120
    }]
  };
}
