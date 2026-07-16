import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export default function endGameFlowTest() {
  const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");

  assert.equal(appSource.includes("タイトル画面へ戻りますか？"), false);
  assert.equal(appSource.includes("退店しますか？"), true);
  assert.equal(appSource.includes("今回の遊技を終了し、各台の設定と最終結果を確認します。"), true);
  assert.equal(appSource.includes("showEndGameConfirm"), false);
  assert.equal(appSource.includes("終了しますか？"), true);
  assert.equal(appSource.includes("現在の結果確認を終了してタイトルへ戻ります。"), true);
  assert.equal(appSource.includes("confirm-result-exit"), true);
  assert.equal(appSource.includes("cancel-result-exit"), true);
  assert.equal(appSource.includes("onExit: showExitConfirm"), true);
  assert.equal(appSource.includes("resetFinishedGameAndShowEntry"), true);
  assert.equal(appSource.includes("resetFinishedGameAndShowTitle"), true);

  const finalBody = extractFunctionBody(appSource, "showFinalResult");
  assert.equal(finalBody.includes("onExit: () => showResultExitConfirm(showFinalResult)"), true);
  assert.equal(finalBody.includes("onViewMachines: showFinishedMachineScreen"), true);

  const reviewBody = extractFunctionBody(appSource, "showFinishedMachineScreen");
  assert.equal(reviewBody.includes("onExit: () => showResultExitConfirm(showFinishedMachineScreen)"), true);
  assert.equal(reviewBody.includes("onFinal: showFinalResult"), true);

  const resultExitConfirmBody = extractFunctionBody(appSource, "showResultExitConfirm");
  assert.equal(resultExitConfirmBody.includes("resetGameSession();"), false);
  assert.equal(resultExitConfirmBody.includes("clearSavedGame();"), false);
  assert.equal(resultExitConfirmBody.includes("resetFinishedGameAndShowTitle"), true);
  assert.equal(resultExitConfirmBody.includes("onCancel"), true);

  const replayBody = extractFunctionBody(appSource, "resetFinishedGameAndShowEntry");
  assert.equal(replayBody.includes("resetGameSession();"), true);
  assert.equal(replayBody.includes("showEntryScreen();"), true);
  assert.equal(replayBody.includes("showTitleScreen();"), false);

  const titleBody = extractFunctionBody(appSource, "resetFinishedGameAndShowTitle");
  assert.equal(titleBody.includes("resetGameSession();"), true);
  assert.equal(titleBody.includes("showTitleScreen();"), true);
  assert.equal(titleBody.includes("showEntryScreen();"), false);

  const resetBody = extractFunctionBody(appSource, "resetGameSession");
  assert.equal(resetBody.includes("clearSavedGame();"), true);
  assert.equal(resetBody.includes("game = null;"), true);
  assert.equal(resetBody.includes("savedAtBoot = null;"), true);
  assert.equal(resetBody.includes("lastRoundNotice = null;"), true);
  assert.equal(resetBody.includes("isPlaying = false;"), true);
  assert.equal(resetBody.includes("persistGame();"), false);
}

function extractFunctionBody(source, functionName) {
  const start = source.indexOf(`function ${functionName}(`);
  assert.notEqual(start, -1);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(bodyStart + 1, index);
    }
  }
  throw new Error(`Function body not found: ${functionName}`);
}
