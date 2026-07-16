import assert from "node:assert/strict";
import {
  calculateMachineMaxAcquiredCoins,
  formatBonusStatusSupplement,
  renderBonusHistory,
  renderMachineActions,
  renderMachineOverview,
  renderMachineProgress,
  renderMachineScreen,
  renderRetroStats,
  renderRoundNotice
} from "../js/ui/machine-screen.js";
import { KING_DEIGO_SPEC } from "../js/specs/king-deigo-spec.js";

export default function machineScreenTest() {
  const progress = renderMachineProgress({
    playerGames: 12,
    playerBig: 1,
    playerReg: 0,
    playerOutCoins: 120,
    playerInCoins: 36,
    chainState: { state: "renchan" }
  });
  assert.equal(progress.includes("連チャン状態"), false);
  assert.equal(progress.includes("通常"), false);

  assert.equal(renderRetroStats({ played: false, playerRetroStats: null }), "");

  const normalBigNotice = renderRoundNotice(createNotice("big", "normal"));
  const normalRegNotice = renderRoundNotice(createNotice("reg", "normal"));
  assert.equal(normalBigNotice.includes("BIG当選"), true);
  assert.equal(normalBigNotice.includes("通常BIG"), false);
  assert.equal(normalRegNotice.includes("REG当選"), true);
  assert.equal(normalRegNotice.includes("通常REG"), false);

  const history = renderBonusHistory({
    played: true,
    bonusHistory: [
      createHistory("big", "normal", false, true),
      createHistory("reg", "normal", false, true),
      createHistory("big", "renchan", false, true),
      createHistory("reg", "renchan", true, true),
      createHistory("big", "dairenchan", false, true)
    ]
  });
  assert.equal(history.includes("通常"), false);
  assert.equal(history.includes("連チャンBIG"), false);
  assert.equal(history.includes("大連チャンBIG"), false);
  assert.equal(history.includes("<strong>BIG</strong>"), true);
  assert.equal(history.includes("<strong>REG</strong>"), true);
  assert.equal(history.includes("連チャン</small>"), true);
  assert.equal(history.includes("連チャン・レトロ"), true);
  assert.equal(history.includes("大連チャン</small>"), true);

  const unplayedHistory = renderBonusHistory({
    played: false,
    bonusHistory: [
      createHistory("big", "renchan", true, false),
      createHistory("reg", "dairenchan", true, false)
    ]
  });
  assert.equal(unplayedHistory.includes("連チャン</small>"), true);
  assert.equal(unplayedHistory.includes("大連チャン</small>"), true);
  assert.equal(unplayedHistory.includes("レトロ"), false);
  assert.equal(unplayedHistory.includes("フェザー"), false);
  assert.equal(unplayedHistory.includes("サイド"), false);

  const longHistory = renderBonusHistory({
    played: true,
    bonusHistory: Array.from({ length: 12 }, (_, index) => ({
      ...createHistory(index % 2 === 0 ? "big" : "reg", "normal", false, true),
      intervalGames: index + 1,
      order: 12 - index
    }))
  });
  assert.equal((longHistory.match(/<li>/g) || []).length, 12);

  assert.equal(formatBonusStatusSupplement({ bonusStatus: "normal" }), "");
  assert.equal(formatBonusStatusSupplement({ bonusStatus: "renchan" }), "連チャン");
  assert.equal(formatBonusStatusSupplement({ bonusStatus: "dairenchan" }), "大連チャン");

  const overview = renderMachineOverview({
    number: 101,
    currentTotalGames: 4236,
    gamesSinceBonus: 184,
    currentBig: 18,
    currentReg: 13,
    currentDifference: 1200,
    graphPoints: [
      { game: 0, difference: 300 },
      { game: 1000, difference: -1200 },
      { game: 2400, difference: 800 }
    ]
  }, {
    currentMachineIndex: 0,
    machines: [{}, {}, {}]
  });
  assert.equal(overview.includes("101番台"), true);
  assert.equal(overview.includes("総回転数"), true);
  assert.equal(overview.includes("4,236G"), true);
  assert.equal(overview.includes("ボーナス後"), true);
  assert.equal(overview.includes("184G"), true);
  assert.equal(overview.includes("最大獲得"), true);
  assert.equal(overview.includes("2,000枚"), true);
  assert.equal(overview.includes("1/235.3"), true);
  assert.equal(overview.includes("1/325.8"), true);
  assert.equal(overview.indexOf("machine-summary-grid") < overview.indexOf("machine-graph-panel"), true);
  assert.equal(calculateMachineMaxAcquiredCoins(createGraphMachine([0, 500, 1000, 400, -500, -1700])), 1000);
  assert.equal(calculateMachineMaxAcquiredCoins(createGraphMachine([0, -800, -1200, -400, 300, -200])), 1500);
  assert.equal(calculateMachineMaxAcquiredCoins(createGraphMachine([0, 800, 300, -1000, -1700])), 800);
  assert.equal(calculateMachineMaxAcquiredCoins(createGraphMachine([-500, -100])), 400);

  const zeroOverview = renderMachineOverview({
    number: 102,
    currentTotalGames: 0,
    gamesSinceBonus: 0,
    currentBig: 0,
    currentReg: 0,
    currentDifference: 0
  }, {
    currentMachineIndex: 1,
    machines: [{}, {}, {}]
  });
  assert.equal(zeroOverview.includes("Infinity"), false);
  assert.equal(zeroOverview.includes("NaN"), false);
  assert.equal(zeroOverview.includes("---"), true);

  const normalOverview = renderMachineOverview({
    number: 103,
    hiddenSetting: 6,
    currentTotalGames: 1000,
    gamesSinceBonus: 77,
    currentBig: 0,
    currentReg: 0,
    currentDifference: 0
  }, {
    currentMachineIndex: 0,
    machines: [{}]
  });
  assert.equal(normalOverview.includes("設定6"), false);

  const reviewOverview = renderMachineOverview({
    number: 103,
    hiddenSetting: 6,
    currentTotalGames: 1000,
    gamesSinceBonus: 77,
    currentBig: 0,
    currentReg: 0,
    currentDifference: 0
  }, {
    currentMachineIndex: 0,
    machines: [{}]
  }, { showSetting: true });
  assert.equal(reviewOverview.includes("設定6"), true);

  const normalActions = renderMachineActions(false);
  const reviewActions = renderMachineActions(true);
  assert.equal(normalActions.includes("勝負する"), true);
  assert.equal(normalActions.includes("退店（終了）"), true);
  assert.equal(reviewActions.includes("勝負する"), false);
  assert.equal(reviewActions.includes("前の台"), true);
  assert.equal(reviewActions.includes("次の台"), true);
  assert.equal(reviewActions.includes("最終結果"), true);
  assert.equal(reviewActions.includes("終了"), true);
  assert.equal(reviewActions.includes("退店"), false);

  const finishedRoot = createRoot();
  renderMachineScreen({
    root: finishedRoot,
    game: createFinishedGame(),
    spec: KING_DEIGO_SPEC,
    roundNotice: null,
    onPrev() {},
    onNext() {},
    onExit() {},
    onFinal() {}
  });
  assert.equal(finishedRoot.innerHTML.includes("設定6"), true);
  assert.equal(finishedRoot.innerHTML.includes("勝負する"), false);
  assert.equal(finishedRoot.innerHTML.includes("合成確率"), true);

  const noticeRoot = createInteractiveRoot();
  let playCount = 0;
  let prevCount = 0;
  let nextCount = 0;
  renderMachineScreen({
    root: noticeRoot,
    game: createPlayableGame(),
    spec: KING_DEIGO_SPEC,
    roundNotice: createNotice(null, "normal"),
    onPlay() { playCount += 1; },
    onPrev() { prevCount += 1; },
    onNext() { nextCount += 1; },
    onExit() {}
  });
  assert.equal(noticeRoot.innerHTML.includes("区切り到達"), true);
  assert.equal(noticeRoot.innerHTML.includes("勝負する"), true);
  assert.equal(noticeRoot.innerHTML.includes("disabled"), false);
  assert.equal(noticeRoot.listeners["[data-action='play']"].length, 1);
  assert.equal(noticeRoot.listeners["[data-action='prev']"].length, 2);
  assert.equal(noticeRoot.listeners["[data-action='next']"].length, 2);
  noticeRoot.fire("[data-action='play']");
  noticeRoot.fire("[data-action='prev']", 0);
  noticeRoot.fire("[data-action='next']", 0);
  assert.equal(playCount, 1);
  assert.equal(prevCount, 1);
  assert.equal(nextCount, 1);

  const reviewRoot = createInteractiveRoot();
  let reviewPrevCount = 0;
  let reviewNextCount = 0;
  let reviewExitCount = 0;
  renderMachineScreen({
    root: reviewRoot,
    game: createFinishedGame(),
    spec: KING_DEIGO_SPEC,
    roundNotice: null,
    onPrev() { reviewPrevCount += 1; },
    onNext() { reviewNextCount += 1; },
    onExit() { reviewExitCount += 1; },
    onFinal() {}
  });
  assert.equal(reviewRoot.listeners["[data-action='prev']"].length, 2);
  assert.equal(reviewRoot.listeners["[data-action='next']"].length, 2);
  assert.equal(reviewRoot.listeners["[data-action='play']"], undefined);
  assert.equal(reviewRoot.listeners["[data-action='exit']"].length, 1);
  reviewRoot.fire("[data-action='prev']", 0);
  reviewRoot.fire("[data-action='next']", 0);
  reviewRoot.fire("[data-action='exit']");
  assert.equal(reviewPrevCount, 1);
  assert.equal(reviewNextCount, 1);
  assert.equal(reviewExitCount, 1);

  const rerenderRoot = createInteractiveRoot();
  const rerenderGame = createFinishedMultiMachineGame();
  const renderReview = () => renderMachineScreen({
    root: rerenderRoot,
    game: rerenderGame,
    spec: KING_DEIGO_SPEC,
    roundNotice: null,
    onPrev() {
      rerenderGame.currentMachineIndex = (rerenderGame.currentMachineIndex + rerenderGame.machines.length - 1) % rerenderGame.machines.length;
      renderReview();
    },
    onNext() {
      rerenderGame.currentMachineIndex = (rerenderGame.currentMachineIndex + 1) % rerenderGame.machines.length;
      renderReview();
    },
    onExit() {},
    onFinal() {}
  });
  renderReview();
  assert.equal(rerenderRoot.innerHTML.includes("101番台"), true);
  assert.equal(rerenderRoot.innerHTML.includes("設定1"), true);
  rerenderRoot.fire("[data-action='next']", 1);
  assert.equal(rerenderRoot.innerHTML.includes("102番台"), true);
  assert.equal(rerenderRoot.innerHTML.includes("設定2"), true);
  assert.equal(rerenderRoot.innerHTML.includes("2,000G"), true);
  assert.equal(rerenderRoot.innerHTML.includes("+200枚"), true);
  rerenderRoot.fire("[data-action='prev']", 1);
  assert.equal(rerenderRoot.innerHTML.includes("101番台"), true);
  rerenderRoot.fire("[data-action='prev']", 1);
  assert.equal(rerenderRoot.innerHTML.includes("110番台"), true);
  assert.equal(rerenderRoot.innerHTML.includes("設定6"), true);
}

function createNotice(bonus, bonusStatus) {
  return {
    bonus,
    chainOutcome: { bonusStatus },
    gamesPlayed: 12,
    machineDifferenceDelta: 114,
    playerOutDelta: 150,
    bonusHints: {},
    bonusDetails: {}
  };
}

function createHistory(type, bonusStatus, retroHit, isPlayerBonus = false) {
  return {
    type,
    intervalGames: 39,
    difference: 120,
    hints: type === "big"
      ? { bigEndFeather: "white" }
      : { regSideLamp: "red" },
    chain: { bonusStatus, retroHit },
    isPlayerBonus,
    source: isPlayerBonus ? "player" : "entry"
  };
}

function createGraphMachine(differences) {
  return {
    graphPoints: differences.map((difference, index) => ({
      game: index,
      difference
    }))
  };
}

function createRoot() {
  globalThis.window = { scrollTo() {} };
  return {
    dataset: {},
    innerHTML: "",
    querySelector() {
      return null;
    }
  };
}

function createInteractiveRoot() {
  globalThis.window = { scrollTo() {} };
  return {
    dataset: {},
    innerHTML: "",
    listeners: {},
    querySelector(selector) {
      if (selector === "[data-graph]") return null;
      return null;
    },
    querySelectorAll(selector) {
      const action = selector.match(/\[data-action='([^']+)'\]/)?.[1];
      if (!action) return [];
      const doubleQuoteCount = countMatches(this.innerHTML, `data-action="${action}"`);
      const singleQuoteCount = countMatches(this.innerHTML, `data-action='${action}'`);
      const count = doubleQuoteCount + singleQuoteCount;
      if (!count) return [];
      this.listeners[selector] = [];
      return Array.from({ length: count }, () => ({
        addEventListener: (_eventName, handler) => {
          this.listeners[selector].push(handler);
        }
      }));
    },
    fire(selector, index = 0) {
      this.listeners[selector]?.[index]?.();
    }
  };
}

function countMatches(text, pattern) {
  return text.split(pattern).length - 1;
}

function createPlayableGame() {
  return {
    isFinished: false,
    entryHour: 20,
    maxGames: 1925,
    remainingGames: 1880,
    currentMachineIndex: 0,
    player: {
      coins: 50,
      cashInvestmentYen: 1000,
      cashLentCoins: 50,
      totalGames: 12
    },
    machines: [{
      id: "machine-1",
      number: 101,
      hiddenSetting: 6,
      currentTotalGames: 1000,
      gamesSinceBonus: 42,
      currentBig: 4,
      currentReg: 2,
      currentDifference: 120,
      graphPoints: [{ game: 0, difference: 0 }, { game: 1000, difference: 120 }],
      playerGames: 12,
      playerBig: 0,
      playerReg: 0,
      playerOutCoins: 20,
      playerInCoins: 36,
      playerRoleCounts: {},
      playerBonusRoleCounts: { bigWatermelon: 0, cherryDuplicate: 0 },
      playerHintCounts: {
        bigEndFeather: {},
        regSideLamp: {}
      },
      latestHints: {},
      playerRetroStats: null,
      played: true,
      bonusHistory: []
    }]
  };
}

function createFinishedGame() {
  return {
    isFinished: true,
    entryHour: 20,
    maxGames: 1925,
    remainingGames: 1880,
    currentMachineIndex: 0,
    player: {
      coins: 0,
      cashInvestmentYen: 0,
      cashLentCoins: 0,
      totalGames: 0
    },
    machines: [{
      id: "machine-1",
      number: 101,
      hiddenSetting: 6,
      currentTotalGames: 1000,
      gamesSinceBonus: 42,
      currentBig: 4,
      currentReg: 2,
      currentDifference: 120,
      graphPoints: [{ game: 0, difference: 0 }, { game: 1000, difference: 120 }],
      playerGames: 0,
      playerBig: 0,
      playerReg: 0,
      playerOutCoins: 0,
      playerInCoins: 0,
      playerRoleCounts: {},
      playerBonusRoleCounts: { bigWatermelon: 0, cherryDuplicate: 0 },
      playerHintCounts: {
        bigEndFeather: {},
        regSideLamp: {}
      },
      latestHints: {},
      playerRetroStats: null,
      played: false,
      bonusHistory: []
    }]
  };
}

function createFinishedMultiMachineGame() {
  const machines = Array.from({ length: 10 }, (_, index) => ({
    id: `machine-${index + 1}`,
    number: 101 + index,
    hiddenSetting: index === 9 ? 6 : index + 1,
    currentTotalGames: (index + 1) * 1000,
    gamesSinceBonus: 50 + index,
    currentBig: index + 1,
    currentReg: index,
    currentDifference: (index + 1) * 100,
    graphPoints: [{ game: 0, difference: 0 }, { game: (index + 1) * 1000, difference: (index + 1) * 100 }],
    playerGames: 0,
    playerBig: 0,
    playerReg: 0,
    playerOutCoins: 0,
    playerInCoins: 0,
    playerRoleCounts: {},
    playerBonusRoleCounts: { bigWatermelon: 0, cherryDuplicate: 0 },
    playerHintCounts: {
      bigEndFeather: {},
      regSideLamp: {}
    },
    latestHints: {},
    playerRetroStats: null,
    played: false,
    bonusHistory: []
  }));

  return {
    isFinished: true,
    entryHour: 20,
    maxGames: 1925,
    remainingGames: 0,
    currentMachineIndex: 0,
    player: {
      coins: 0,
      cashInvestmentYen: 0,
      cashLentCoins: 0,
      totalGames: 0
    },
    machines
  };
}
