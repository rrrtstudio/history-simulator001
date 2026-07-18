import { SCREEN } from "../utils/constants.js?v=20260719-scroll-anchor";
import { setScreen, bind } from "./screen-manager.js?v=20260719-scroll-anchor";
import { formatNumber } from "./formatters.js";

export function renderTitleScreen({ root, onPlay }) {
  setScreen(root, SCREEN.TITLE, `
    <section class="title-screen">
      <div class="title-screen__background" aria-hidden="true"></div>
      <div class="title-screen__content">
        <h1 class="title-screen__logo">履歴打ちシミュレーター</h1>
        <button class="button button-primary title-screen__play-button" data-action="play-title">プレーする</button>
      </div>
    </section>
  `);
  bind(root, "[data-action='play-title']", "click", onPlay);
}

export function renderStartScreen({ root, onContinue, onNew }) {
  setScreen(root, SCREEN.START, `
    <section class="screen-panel start-panel">
      <div class="brand-block">
        <p class="eyebrow">HISTORY SIMULATOR</p>
        <h1>履歴打ちシミュレーター</h1>
        <p class="subhead">履歴打ちシミュレーター</p>
      </div>
      <div class="action-stack">
        <button class="button button-primary" data-action="continue">続きから</button>
        <button class="button button-secondary" data-action="new">最初から</button>
      </div>
    </section>
  `);
  bind(root, "[data-action='continue']", "click", onContinue);
  bind(root, "[data-action='new']", "click", onNew);
}

export function renderEntryScreen({ root, entryOptions, onStart }) {
  setScreen(root, SCREEN.ENTRY, `
    <section class="screen-panel">
      <div class="section-heading">
        <p class="eyebrow">ENTRY TIME</p>
        <h1>入店時間選択</h1>
      </div>
      <div class="entry-grid">
        ${entryOptions.map((option) => `
          <button class="entry-choice" data-hour="${option.hour}">
            <strong>${option.hour}時入店</strong>
            <span>閉店まで最大${formatNumber(option.maxGames)}G相当</span>
          </button>
        `).join("")}
      </div>
    </section>
  `);
  root.querySelectorAll("[data-hour]").forEach((button) => {
    button.addEventListener("click", () => onStart(Number(button.dataset.hour)));
  });
}
