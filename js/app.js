import { TIME_CONFIG } from "./config/time-config.js?v=20260719-scroll-anchor";
import { KING_DEIGO_SPEC } from "./specs/king-deigo-spec.js?v=20260719-scroll-anchor";
import { createRandom } from "./core/random.js";
import { playRound } from "./core/play-engine.js?v=20260719-scroll-anchor";
import { closePlayerSegment } from "./core/player-graph.js";
import { finishGame, createNewGame, hasFinishedSave, hasPlayableSave } from "./state/game-state.js?v=20260719-scroll-anchor";
import { moveMachine } from "./state/machine-state.js";
import { clearSavedGame, loadSavedGame, saveGame } from "./state/storage.js?v=20260719-scroll-anchor";
import { ROUND_END_REASON } from "./utils/constants.js?v=20260719-scroll-anchor";
import { SCREEN } from "./utils/constants.js?v=20260719-scroll-anchor";
import { setScreen, bind } from "./ui/screen-manager.js?v=20260719-scroll-anchor";
import { renderEntryScreen, renderStartScreen, renderTitleScreen } from "./ui/entry-screen.js?v=20260719-scroll-anchor";
import { renderMachineScreen } from "./ui/machine-screen.js?v=20260719-scroll-anchor";
import { renderFinalResultScreen } from "./ui/final-result-screen.js?v=20260719-scroll-anchor";

const root = document.querySelector("#app");
const rng = createRandom();
let game = null;
let savedAtBoot = null;
let lastRoundNotice = null;
let isPlaying = false;

try {
  init();
} catch (error) {
  renderBootError(error);
}

window.addEventListener("unhandledrejection", (event) => {
  renderBootError(event.reason);
});

function init() {
  savedAtBoot = loadSavedGame();
  showTitleScreen();
}

function showTitleScreen() {
  renderTitleScreen({
    root,
    onPlay: proceedFromTitle
  });
}

function proceedFromTitle() {
  if (hasPlayableSave(savedAtBoot)) {
    renderStartScreen({
      root,
      onContinue: continueSavedGame,
      onNew: beginFromScratch
    });
    return;
  }
  if (hasFinishedSave(savedAtBoot)) {
    game = savedAtBoot;
    showFinalResult();
    return;
  }
  showEntryScreen();
}

function continueSavedGame() {
  game = savedAtBoot;
  lastRoundNotice = null;
  showMachineScreen();
}

function showEntryScreen() {
  renderEntryScreen({
    root,
    entryOptions: TIME_CONFIG.entryOptions,
    onStart: startNewGame
  });
}

function beginFromScratch() {
  clearSavedGame();
  game = null;
  savedAtBoot = null;
  showEntryScreen();
}

function startNewGame(entryHour) {
  clearSavedGame();
  lastRoundNotice = null;
  isPlaying = false;
  game = createNewGame({ entryHour, spec: KING_DEIGO_SPEC, rng });
  persistGame();
  showMachineScreen();
}

function showMachineScreen({ preserveScroll = false, scrollPosition = null } = {}) {
  if (game.remainingGames <= 0 && !game.isFinished) {
    finishAndShowFinal("closed");
    return;
  }
  if (game.isFinished) {
    showFinishedMachineScreen({ preserveScroll, scrollPosition });
    return;
  }
  renderMachineScreen({
    root,
    game,
    spec: KING_DEIGO_SPEC,
    roundNotice: lastRoundNotice,
    onPlay: playCurrentMachine,
    onPrev: (position) => moveAndShow(-1, position),
    onNext: (position) => moveAndShow(1, position),
    onExit: showExitConfirm,
    preserveScroll,
    scrollPosition
  });
}

function playCurrentMachine() {
  if (!game || game.isFinished || isPlaying) return;
  isPlaying = true;
  try {
    const result = playRound({ game, spec: KING_DEIGO_SPEC, rng });
    persistGame();
    if (result.reason === ROUND_END_REASON.CLOSING || result.reason === ROUND_END_REASON.NO_GAMES || game.remainingGames <= 0) {
      finishAndShowFinal("closed");
      return;
    }
    lastRoundNotice = result;
    showMachineScreen();
  } finally {
    isPlaying = false;
  }
}

function moveAndShow(direction, scrollPosition = null) {
  lastRoundNotice = null;
  closePlayerSegment(game);
  moveMachine(game, direction);
  persistGame();
  showMachineScreen({ preserveScroll: true, scrollPosition });
}

function showExitConfirm() {
  setScreen(root, SCREEN.EXIT_CONFIRM, `
    <section class="screen-panel exit-panel">
      <div class="section-heading">
        <p class="eyebrow">LEAVE HALL</p>
        <h1>退店しますか？</h1>
      </div>
      <p class="empty-text">今回の遊技を終了し、各台の設定と最終結果を確認します。</p>
      <div class="action-stack">
        <button class="button button-danger" data-action="confirm">退店する</button>
        <button class="button button-secondary" data-action="cancel">キャンセル</button>
      </div>
    </section>
  `);
  bind(root, "[data-action='confirm']", "click", () => finishAndShowFinal("retired"));
  bind(root, "[data-action='cancel']", "click", showMachineScreen);
}

function finishAndShowFinal(reason) {
  lastRoundNotice = null;
  closePlayerSegment(game);
  finishGame(game, reason);
  persistGame();
  showFinishedMachineScreen();
}

function showFinalResult() {
  renderFinalResultScreen({
    root,
    game,
    onViewMachines: showFinishedMachineScreen,
    onReplay: resetFinishedGameAndShowEntry,
    onExit: () => showResultExitConfirm(showFinalResult)
  });
}

function showFinishedMachineScreen({ preserveScroll = false, scrollPosition = null } = {}) {
  lastRoundNotice = null;
  persistGame();
  renderMachineScreen({
    root,
    game,
    spec: KING_DEIGO_SPEC,
    roundNotice: null,
    reviewMode: true,
    onPrev: (position) => moveFinishedAndShow(-1, position),
    onNext: (position) => moveFinishedAndShow(1, position),
    onFinal: showFinalResult,
    onExit: () => showResultExitConfirm(showFinishedMachineScreen),
    preserveScroll,
    scrollPosition
  });
}

function showResultExitConfirm(onCancel) {
  setScreen(root, SCREEN.EXIT_CONFIRM, `
    <section class="screen-panel exit-panel">
      <div class="section-heading">
        <h1>終了しますか？</h1>
      </div>
      <p class="empty-text">現在の結果確認を終了してタイトルへ戻ります。</p>
      <div class="action-stack">
        <button class="button button-danger" data-action="confirm-result-exit">終了する</button>
        <button class="button button-secondary" data-action="cancel-result-exit">キャンセル</button>
      </div>
    </section>
  `);
  bind(root, "[data-action='confirm-result-exit']", "click", resetFinishedGameAndShowTitle);
  bind(root, "[data-action='cancel-result-exit']", "click", onCancel);
}

function moveFinishedAndShow(direction, scrollPosition = null) {
  moveMachine(game, direction);
  persistGame();
  showFinishedMachineScreen({ preserveScroll: true, scrollPosition });
}

function resetFinishedGameAndShowEntry() {
  resetGameSession();
  showEntryScreen();
}

function resetFinishedGameAndShowTitle() {
  resetGameSession();
  showTitleScreen();
}

function resetGameSession() {
  if (game) closePlayerSegment(game);
  clearSavedGame();
  game = null;
  savedAtBoot = null;
  lastRoundNotice = null;
  isPlaying = false;
}

window.addEventListener("beforeunload", () => {
  if (game) persistGame();
});

function persistGame() {
  if (!game) return;
  try {
    saveGame(game);
  } catch (error) {
    console.error(error);
  }
}

function renderBootError(error) {
  console.error(error);
  if (!root) return;
  setScreen(root, "boot-error", `
    <section class="screen-panel">
      <div class="section-heading">
        <p class="eyebrow">ERROR</p>
        <h1>読み込みに失敗しました</h1>
      </div>
      <p class="empty-text">
        保存データをクリアしても直らない場合は、ページを再読み込みしてください。
      </p>
      <div class="action-stack">
        <button class="button button-primary" data-action="clear-save">保存データをクリア</button>
      </div>
    </section>
  `);
  bind(root, "[data-action='clear-save']", "click", () => {
    clearSavedGame();
    location.reload();
  });
}
