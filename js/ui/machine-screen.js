import { SCREEN } from "../utils/constants.js";
import { formatClockByGames } from "../core/time-engine.js?v=20260719-final-table";
import { setScreen, bind } from "./screen-manager.js?v=20260719-final-table";
import { renderGraph } from "./graph-renderer.js";
import {
  bonusLabel,
  formatCoins,
  formatBonusRate,
  formatNumber,
  formatObservedRate,
  formatSignedCoins,
  formatYen,
  roleLabel
} from "./formatters.js";

const HINT_LABELS = {
  white: "白",
  blue: "青",
  yellow: "黄",
  green: "緑",
  red: "赤",
  rainbow: "虹"
};

export function renderMachineScreen({
  root,
  game,
  spec,
  roundNotice,
  onPlay,
  onPrev,
  onNext,
  onExit,
  onFinal,
  reviewMode = false,
  preserveScroll = false,
  scrollPosition = null
}) {
  const machine = game.machines[game.currentMachineIndex];
  const isReviewMode = Boolean(reviewMode || game.isFinished);
  setScreen(root, SCREEN.MACHINE, `
    <section class="game-view">
      <div class="machine-sticky-header">
        ${renderStatusBar(game)}
        ${renderMachineNavigation(machine, game, { showSetting: isReviewMode })}
      </div>
      ${renderRoundNotice(roundNotice)}
      ${renderMachineOverview(machine)}

      <section class="two-column">
        <div class="panel">
          <div class="panel-heading"><h2>この台の遊技</h2></div>
          ${renderMachineProgress(machine)}
        </div>
        <div class="panel">
          <div class="panel-heading"><h2>子役記録</h2></div>
          ${renderRoleStats(spec, machine)}
        </div>
      </section>

      <section class="panel">
        <div class="panel-heading"><h2>設定推測メモ</h2></div>
        ${renderHintStats(spec, machine)}
        ${renderRetroStats(machine)}
      </section>

      <section class="panel">
        <div class="panel-heading"><h2>ボーナス履歴</h2></div>
        ${renderBonusHistory(machine)}
      </section>

      ${renderMachineActions(isReviewMode)}
    </section>
  `, { preserveScroll, scrollPosition });
  renderGraph(root.querySelector("[data-graph]"), machine.graphPoints);
  let navigationScrollPosition = null;
  const rememberNavigationScroll = () => {
    navigationScrollPosition = getScrollPosition();
  };
  root.querySelectorAll?.("[data-action='prev'], [data-action='next']").forEach((button) => {
    button.addEventListener("pointerdown", rememberNavigationScroll, { passive: true });
    button.addEventListener("touchstart", rememberNavigationScroll, { passive: true });
  });
  const consumeNavigationScroll = () => {
    const position = navigationScrollPosition || getScrollPosition();
    navigationScrollPosition = null;
    return position;
  };
  bind(root, "[data-action='prev']", "click", () => onPrev?.(consumeNavigationScroll()));
  bind(root, "[data-action='next']", "click", () => onNext?.(consumeNavigationScroll()));
  bind(root, "[data-action='exit']", "click", onExit);
  if (isReviewMode) {
    bind(root, "[data-action='final']", "click", onFinal);
  } else {
    bind(root, "[data-action='play']", "click", onPlay);
  }
}

function getScrollPosition() {
  return {
    x: Number(window.scrollX ?? window.pageXOffset ?? 0),
    y: Number(window.scrollY ?? window.pageYOffset ?? 0)
  };
}

export function renderMachineNavigation(machine, game, { showSetting = false } = {}) {
  return `
    <section class="machine-nav-strip" aria-label="台移動">
      <div class="machine-title-nav" aria-label="台番号">
        <button class="machine-title-nav__button" type="button" data-action="prev" aria-label="前の台へ移動">＜</button>
        <h1>${machine.number}番台</h1>
        <button class="machine-title-nav__button" type="button" data-action="next" aria-label="次の台へ移動">＞</button>
      </div>
      <div class="machine-nav-meta">
        ${showSetting ? `<p class="machine-setting">設定${machine.hiddenSetting}</p>` : ""}
        <div class="machine-count">${game.currentMachineIndex + 1} / ${game.machines.length}</div>
      </div>
    </section>
  `;
}

export function renderMachineOverview(machine) {
  const maxAcquiredCoins = calculateMachineMaxAcquiredCoins(machine);
  return `
    <section class="machine-overview">
      <section class="machine-data-focus">
        <div class="machine-summary-grid">
          <div class="metric metric-compact">
            <span>総回転数</span>
            <strong>${formatNumber(machine.currentTotalGames)}G</strong>
          </div>
          <div class="metric metric-compact">
            <span>ボーナス後</span>
            <strong>${formatNumber(machine.gamesSinceBonus ?? machine.currentTotalGames ?? 0)}G</strong>
          </div>
          <div class="metric metric-compact">
            <span>BIG</span>
            <strong>${formatNumber(machine.currentBig)}回</strong>
            <em>${formatObservedRate(machine.currentTotalGames, machine.currentBig)}</em>
          </div>
          <div class="metric metric-compact">
            <span>REG</span>
            <strong>${formatNumber(machine.currentReg)}回</strong>
            <em>${formatObservedRate(machine.currentTotalGames, machine.currentReg)}</em>
          </div>
          <div class="metric metric-compact">
            <span>合成確率</span>
            <strong>${formatBonusRate(machine.currentBig + machine.currentReg, machine.currentTotalGames)}</strong>
          </div>
          <div class="metric metric-compact ${machine.currentDifference >= 0 ? "is-plus" : "is-minus"}">
            <span>現在差枚</span>
            <strong>${formatSignedCoins(machine.currentDifference)}</strong>
          </div>
          <div class="metric metric-compact">
            <span>最大獲得</span>
            <strong>${formatCoins(maxAcquiredCoins)}</strong>
          </div>
        </div>

        <section class="panel graph-panel machine-graph-panel">
          <div class="panel-heading">
            <h2>スランプグラフ</h2>
            <span>${formatSignedCoins(machine.currentDifference)}</span>
          </div>
          <canvas class="slump-graph" data-graph></canvas>
        </section>
      </section>
    </section>
  `;
}

export function calculateMachineMaxAcquiredCoins(machine) {
  const points = Array.isArray(machine.graphPoints) ? machine.graphPoints : [];
  if (!points.length) return 0;

  let minSoFar = Number(points[0].difference || 0);
  let maxGain = 0;

  for (const point of points) {
    const difference = Number(point.difference || 0);
    maxGain = Math.max(maxGain, difference - minSoFar);
    minSoFar = Math.min(minSoFar, difference);
  }

  return Math.max(0, Math.round(maxGain));
}

export function renderMachineActions(isReviewMode) {
  if (isReviewMode) {
    return `
      <nav class="action-bar action-bar-review" aria-label="終了後の台操作">
        <button class="button button-secondary" data-action="prev">前の台</button>
        <button class="button button-secondary" data-action="next">次の台</button>
        <button class="button button-primary" data-action="final">最終結果</button>
        <button class="button button-danger" data-action="exit">終了</button>
      </nav>
    `;
  }

  return `
    <nav class="action-bar" aria-label="台操作">
      <button class="button button-secondary" data-action="prev">前の台</button>
      <button class="button button-primary button-play" data-action="play">勝負する</button>
      <button class="button button-secondary" data-action="next">次の台</button>
      <button class="button button-danger" data-action="exit">退店（終了）</button>
    </nav>
  `;
}

export function renderMachineProgress(machine) {
  return `
    <div class="mini-grid">
      <div class="mini-stat"><span>自分のG数</span><strong>${formatNumber(machine.playerGames)}G</strong></div>
      <div class="mini-stat"><span>BIG</span><strong>${formatNumber(machine.playerBig)}回</strong></div>
      <div class="mini-stat"><span>REG</span><strong>${formatNumber(machine.playerReg)}回</strong></div>
      <div class="mini-stat"><span>この台の遊技差枚</span><strong>${formatSignedCoins(machine.playerOutCoins - machine.playerInCoins)}</strong></div>
    </div>
  `;
}

function renderStatusBar(game) {
  const currentBalance = game.player.coins - game.player.cashLentCoins;
  return `
    <section class="status-bar">
      <div><span>現在時刻</span><strong>${formatClockByGames(game.entryHour, game.maxGames, game.remainingGames)}</strong></div>
      <div><span>残りG</span><strong>${formatNumber(game.remainingGames)}G</strong></div>
      <div><span>総投資</span><strong>${formatYen(game.player.cashInvestmentYen)}（貸出${formatCoins(game.player.cashLentCoins)}）</strong></div>
      <div><span>持ちコイン</span><strong>${formatCoins(game.player.coins)}</strong></div>
      <div class="${currentBalance >= 0 ? "is-plus" : "is-minus"}"><span>現在収支</span><strong>${formatSignedCoins(currentBalance)}</strong></div>
      <div><span>総G</span><strong>${formatNumber(game.player.totalGames)}G</strong></div>
    </section>
  `;
}

export function renderRoundNotice(result) {
  if (!result) return "";
  const isBonus = Boolean(result.bonus);
  const title = isBonus ? `${bonusLabel(result.bonus)}当選` : "区切り到達";
  const detail = [
    `${formatNumber(result.gamesPlayed)}G消化`,
    `区間 ${formatSignedCoins(result.machineDifferenceDelta)}`
  ];
  if (isBonus) {
    detail.push(`回収 ${formatCoins(result.bonusNetPayout ?? result.playerOutDelta)}`);
  }
  return `
    <section class="round-notice ${isBonus ? "is-bonus" : ""}">
      <strong>${title}</strong>
      <span>${detail.join(" / ")}</span>
      ${renderBonusNoticeDetails(result)}
    </section>
  `;
}

function renderBonusNoticeDetails(result) {
  if (!result?.bonus) return "";
  const notes = [];
  if (result.duplicateRole) notes.push("チェリー重複");
  if (result.bonusDetails?.bigWatermelon) notes.push(`BIG中スイカ ${result.bonusDetails.bigWatermelon}回`);
  if (result.bonusHints?.bigEndFeather) notes.push(`BIGフェザー ${HINT_LABELS[result.bonusHints.bigEndFeather]}`);
  if (result.bonusHints?.regSideLamp) notes.push(`REGサイド ${HINT_LABELS[result.bonusHints.regSideLamp]}`);
  if (result.chainOutcome?.retroHit) notes.push("レトロ");
  return notes.length ? `<em>${notes.join(" / ")}</em>` : "";
}

function renderRoleStats(spec, machine) {
  if (!machine.played) {
    return `<p class="empty-text">遊技後に確認できます</p>`;
  }
  return `
    <div class="role-grid">
      ${spec.displayRoleIds.map((roleId) => {
        const count = machine.playerRoleCounts[roleId] || 0;
        return `
          <div class="mini-stat">
            <span>${roleLabel(spec, roleId)}</span>
            <strong>${formatNumber(count)}回</strong>
            <em>${formatObservedRate(machine.playerGames, count)}</em>
          </div>
        `;
      }).join("")}
      <div class="mini-stat">
        <span>BIG中スイカ</span>
        <strong>${formatNumber(machine.playerBonusRoleCounts.bigWatermelon)}回</strong>
        <em>${machine.playerBig ? `${formatNumber(machine.playerBig)}回分` : "---"}</em>
      </div>
      <div class="mini-stat">
        <span>チェリー重複</span>
        <strong>${formatNumber(machine.playerBonusRoleCounts.cherryDuplicate)}回</strong>
        <em>${machine.playerBig + machine.playerReg ? `${formatNumber(machine.playerBig + machine.playerReg)}回分` : "---"}</em>
      </div>
    </div>
  `;
}

function renderHintStats(spec, machine) {
  if (!machine.played || (!machine.playerBig && !machine.playerReg)) {
    return `<p class="empty-text">プレイヤー遊技中のボーナス後に確認できます</p>`;
  }

  return `
    <div class="hint-blocks">
      ${renderHintGroup({
        title: "BIG後フェザー",
        total: machine.playerBig,
        latest: machine.latestHints?.bigEndFeather,
        colors: spec.hints?.bigEndFeather?.colors || [],
        counts: machine.playerHintCounts?.bigEndFeather || {}
      })}
      ${renderHintGroup({
        title: "REGサイドランプ",
        total: machine.playerReg,
        latest: machine.latestHints?.regSideLamp,
        colors: spec.hints?.regSideLamp?.colors || [],
        counts: machine.playerHintCounts?.regSideLamp || {}
      })}
    </div>
  `;
}

export function renderRetroStats(machine) {
  const stats = machine.playerRetroStats;
  if (!stats || !machine.played) {
    return "";
  }

  return `
    <div class="retro-summary">
      <strong>レトロ</strong>
      <span>BIG: ${formatRetroRatio(stats.big)}</span>
      <span>REG: ${formatRetroRatio(stats.reg)}</span>
      <span>合計: ${formatRetroRatio(stats.total)}</span>
    </div>
  `;
}

function formatRetroRatio(value = {}) {
  return `${formatNumber(value.hits || 0)}/${formatNumber(value.draws || 0)}`;
}

function renderHintGroup({ title, total, latest, colors, counts }) {
  return `
    <div class="hint-group">
      <div class="hint-summary">
        <strong>${title}</strong>
        <span>直近: ${latest ? HINT_LABELS[latest] : "-"}</span>
      </div>
      <div class="hint-grid">
        ${colors.map((color) => {
          const count = counts[color] || 0;
          const percent = total ? `${((count / total) * 100).toFixed(1)}%` : "-";
          return `
            <div class="mini-stat">
              <span>${HINT_LABELS[color] || color}</span>
              <strong>${formatNumber(count)}回</strong>
              <em>${percent}</em>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

export function renderBonusHistory(machine) {
  const histories = Array.isArray(machine.bonusHistory) ? machine.bonusHistory : [];
  const canShowPrivateHistory = Boolean(machine.played);
  if (!histories.length) {
    return `<p class="empty-text">履歴なし</p>`;
  }
  return `
    <ol class="history-list">
      ${histories.map((history) => {
        const showPrivateInfo = canShowPrivateHistory && history.isPlayerBonus === true;
        return `
          <li>
            <strong>${bonusLabel(history.type)}</strong>
            <span class="history-detail">
              <span>${formatNumber(history.intervalGames)}G${renderHistoryHint(history, showPrivateInfo)}</span>
              ${renderHistorySupplement(history, showPrivateInfo)}
            </span>
            <em>${formatSignedCoins(history.difference)}</em>
          </li>
        `;
      }).join("")}
    </ol>
  `;
}

function renderHistoryHint(history, showPrivateInfo = false) {
  if (!showPrivateInfo) return "";
  const notes = [];
  const color = history.hints?.bigEndFeather || history.hints?.regSideLamp;
  if (color) {
    const label = history.hints?.bigEndFeather ? "フェザー" : "サイド";
    notes.push(`${label}${HINT_LABELS[color] || color}`);
  }
  return notes.length ? ` / ${notes.join(" / ")}` : "";
}

function renderHistorySupplement(history, showPrivateInfo = false) {
  const notes = [];
  const chainLabel = formatBonusStatusSupplement(history.chain);
  if (chainLabel) notes.push(chainLabel);
  if (showPrivateInfo && history.chain?.retroHit) notes.push("レトロ");
  return notes.length ? `<small class="history-supplement">${notes.join("・")}</small>` : "";
}

export function formatBonusStatusSupplement(chain) {
  if (chain?.bonusStatus === "dairenchan") return "大連チャン";
  if (chain?.bonusStatus === "renchan") return "連チャン";
  return "";
}
