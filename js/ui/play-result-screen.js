import { SCREEN } from "../utils/constants.js";
import { ROUND_END_REASON } from "../utils/constants.js";
import { setScreen, bind } from "./screen-manager.js?v=20260719-scroll-anchor";
import {
  bonusLabel,
  formatCoins,
  formatNumber,
  formatSignedCoins,
  formatYen
} from "./formatters.js";

export function renderPlayResultScreen({ root, result, game, onContinue, onPrev, onNext, onExit, onFinal }) {
  const isClosing = result.reason === ROUND_END_REASON.CLOSING || game.remainingGames <= 0;
  setScreen(root, SCREEN.PLAY_RESULT, `
    <section class="screen-panel result-panel">
      <div class="section-heading">
        <p class="eyebrow">ROUND RESULT</p>
        <h1>${getResultTitle(result)}</h1>
      </div>
      <div class="metric-grid">
        <div class="metric"><span>遊技G</span><strong>${formatNumber(result.gamesPlayed)}G</strong></div>
        <div class="metric"><span>開始</span><strong>${formatCoins(result.startCoins)}</strong></div>
        <div class="metric"><span>終了</span><strong>${formatCoins(result.endCoins)}</strong></div>
        <div class="metric ${result.coinDelta >= 0 ? "is-plus" : "is-minus"}"><span>増減</span><strong>${formatSignedCoins(result.coinDelta)}</strong></div>
        <div class="metric"><span>追加投資</span><strong>${formatYen(result.investment?.investedYen || 0)}</strong></div>
        <div class="metric"><span>残り</span><strong>${formatNumber(game.remainingGames)}G</strong></div>
      </div>
      ${renderBonusBlock(result)}
      <nav class="action-stack">
        ${isClosing ? `
          <button class="button button-primary" data-action="final">最終結果へ</button>
        ` : `
          <button class="button button-primary" data-action="continue">続行</button>
          <div class="split-actions">
            <button class="button button-secondary" data-action="prev">前の台</button>
            <button class="button button-secondary" data-action="next">次の台</button>
          </div>
          <button class="button button-danger" data-action="exit">退店（終了）</button>
        `}
      </nav>
    </section>
  `);
  bind(root, "[data-action='continue']", "click", onContinue);
  bind(root, "[data-action='prev']", "click", onPrev);
  bind(root, "[data-action='next']", "click", onNext);
  bind(root, "[data-action='exit']", "click", onExit);
  bind(root, "[data-action='final']", "click", onFinal);
}

function getResultTitle(result) {
  if (result.reason === ROUND_END_REASON.BONUS) return `${bonusLabel(result.bonus)}当選`;
  if (result.reason === ROUND_END_REASON.CLOSING) return "閉店";
  if (result.reason === ROUND_END_REASON.NO_COINS) return "持ちコイン不足";
  return "区切り到達";
}

function renderBonusBlock(result) {
  if (result.reason !== ROUND_END_REASON.BONUS) return "";
  const notes = [];
  if (result.duplicateRole) notes.push("チェリー重複");
  if (result.bonusDetails?.bigWatermelon) notes.push(`BIG中スイカ ${result.bonusDetails.bigWatermelon}回`);
  if (result.bonusHints?.regSideLamp) notes.push(`REGサイド ${result.bonusHints.regSideLamp}`);
  if (result.bonusHints?.bigEndFeather) notes.push(`BIGフェザー ${result.bonusHints.bigEndFeather}`);
  return `<p class="result-note">${notes.length ? notes.join(" / ") : "ボーナス獲得枚数を加算しました"}</p>`;
}
