import { SCREEN } from "../utils/constants.js?v=20260719-final-table";
import { formatClockByGames } from "../core/time-engine.js?v=20260719-final-table";
import { calculateMachinePlayerResult, calculatePlayerResult } from "../core/result-calculator.js";
import { calculateGraphStats } from "../core/graph-data.js?v=20260719-final-table";
import { setScreen, bind } from "./screen-manager.js?v=20260719-final-table";
import { renderGraph } from "./graph-renderer.js";
import {
  formatBonusRate,
  formatCoins,
  formatNumber,
  formatSignedCoins,
  formatSignedYen,
  formatYen
} from "./formatters.js";

export function renderFinalResultScreen({ root, game, onReplay, onExit, onViewMachines }) {
  const result = calculatePlayerResult(game);
  const playerGraphStats = calculateGraphStats(game.player.graphPoints || []);
  setScreen(root, SCREEN.FINAL_RESULT, `
    <section class="screen-panel final-panel">
      <div class="section-heading">
        <p class="eyebrow">FINAL RESULT</p>
        <h1>最終結果</h1>
      </div>
      <section class="final-summary-grid">
        <div class="metric"><span>総投資</span><strong>${formatYen(result.totalInvestmentYen)}（貸出${formatCoins(result.cashLentCoins)}）</strong></div>
        <div class="metric"><span>総回収</span><strong>${formatCoins(result.totalRecoveryCoins)}</strong></div>
        <div class="metric ${result.totalBalanceCoins >= 0 ? "is-plus" : "is-minus"}"><span>最終収支</span><strong>${formatSignedCoins(result.totalBalanceCoins)}</strong></div>
        <div class="metric"><span>総G</span><strong>${formatNumber(result.totalGames)}G</strong></div>
        <div class="metric"><span>遊技台数</span><strong>${formatNumber(result.playedMachineCount)}台</strong></div>
        <div class="metric ${result.referenceYen >= 0 ? "is-plus" : "is-minus"}"><span>参考収支</span><strong>${formatSignedYen(result.referenceYen)}</strong></div>
        <div class="metric"><span>入店</span><strong>${game.entryHour}:00</strong></div>
        <div class="metric"><span>退店</span><strong>${formatClockByGames(game.entryHour, game.maxGames, game.remainingGames)}</strong></div>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <h2>あなたの遊技スランプ</h2>
          <span>${formatSignedCoins(playerGraphStats.final)}</span>
        </div>
        ${game.player.totalGames ? `
          <div class="metric-grid graph-summary">
            <div class="metric ${playerGraphStats.final >= 0 ? "is-plus" : "is-minus"}"><span>最終</span><strong>${formatSignedCoins(playerGraphStats.final)}</strong></div>
            <div class="metric ${playerGraphStats.max >= 0 ? "is-plus" : "is-minus"}"><span>最高</span><strong>${formatSignedCoins(playerGraphStats.max)}</strong></div>
            <div class="metric ${playerGraphStats.min >= 0 ? "is-plus" : "is-minus"}"><span>最低</span><strong>${formatSignedCoins(playerGraphStats.min)}</strong></div>
          </div>
          <canvas class="slump-graph player-slump-graph" data-player-graph></canvas>
        ` : `<p class="empty-text">遊技記録がありません</p>`}
      </section>

      <section class="panel table-panel">
        <div class="panel-heading"><h2>台ごとの遊技結果</h2></div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>台</th><th>G</th><th>BIG</th><th>REG</th><th>この台の遊技差枚</th>
              </tr>
            </thead>
            <tbody>
              ${game.machines.filter((machine) => machine.played).map((machine) => {
                const row = calculateMachinePlayerResult(machine);
                return `
                  <tr>
                    <td>${row.machineNumber}</td>
                    <td>${formatNumber(row.games)}</td>
                    <td>${formatNumber(row.big)}</td>
                    <td>${formatNumber(row.reg)}</td>
                    <td>${formatSignedCoins(row.difference)}</td>
                  </tr>
                `;
              }).join("") || `<tr><td colspan="5">遊技なし</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel table-panel">
        <div class="panel-heading"><h2>10台一覧</h2></div>
        <div class="table-scroll machine-list-scroll">
          <table class="machine-list-table">
            <thead>
              <tr>
                <th class="sticky-col sticky-play">遊技</th>
                <th class="sticky-col sticky-machine">台番号</th>
                <th class="sticky-col sticky-setting">設定</th>
                <th>差枚</th>
                <th>総G</th>
                <th>BIG</th>
                <th>BIG確率</th>
                <th>REG</th>
                <th>REG確率</th>
                <th>合成</th>
              </tr>
            </thead>
            <tbody>
              ${game.machines.map((machine) => `
                <tr>
                  <td class="sticky-col sticky-play machine-play-cell" aria-label="${machine.played ? "遊技済み" : "未遊技"}">${machine.played ? "○" : "×"}</td>
                  <td class="sticky-col sticky-machine">${machine.number}</td>
                  <td class="sticky-col sticky-setting">${machine.hiddenSetting}</td>
                  <td class="${machine.currentDifference >= 0 ? "is-plus" : "is-minus"}">${formatSignedCoins(machine.currentDifference)}</td>
                  <td>${formatNumber(machine.currentTotalGames)}</td>
                  <td>${formatNumber(machine.currentBig)}</td>
                  <td>${formatBonusRate(machine.currentBig, machine.currentTotalGames)}</td>
                  <td>${formatNumber(machine.currentReg)}</td>
                  <td>${formatBonusRate(machine.currentReg, machine.currentTotalGames)}</td>
                  <td>${formatBonusRate(machine.currentBig + machine.currentReg, machine.currentTotalGames)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>

      <div class="action-stack">
        <button class="button button-secondary" data-action="view-machines">各台を見る</button>
        <button class="button button-primary" data-action="replay">もう一度遊ぶ</button>
        <button class="button button-danger" data-action="end">終了</button>
      </div>
    </section>
  `);
  const playerGraph = root.querySelector("[data-player-graph]");
  if (playerGraph) {
    renderGraph(playerGraph, game.player.graphPoints, {
      markers: createSegmentMarkers(game.player.playSegments)
    });
  }
  bind(root, "[data-action='replay']", "click", onReplay);
  bind(root, "[data-action='end']", "click", onExit);
  bind(root, "[data-action='view-machines']", "click", onViewMachines);
}

function createSegmentMarkers(segments = []) {
  return segments.map((segment) => ({
    game: segment.startPlayerGame,
    label: `${segment.machineNumber}番台`
  }));
}
