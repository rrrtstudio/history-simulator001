import { GAME_CONFIG } from "../config/game-config.js?v=20260719-final-table-compact";
import { getMaxGamesForEntry } from "../core/time-engine.js?v=20260719-final-table-compact";
import { generateMachines } from "../core/history-generator.js?v=20260719-final-table-compact";
import { createPlayerState } from "./player-state.js?v=20260719-final-table-compact";
import { createId } from "../utils/helpers.js";
import { ACTIVE_SPEC_ID, SCHEMA_VERSION } from "../utils/constants.js?v=20260719-final-table-compact";

export function createNewGame({ entryHour, spec, rng }) {
  const maxGames = getMaxGamesForEntry(entryHour);
  return {
    schemaVersion: SCHEMA_VERSION,
    gameId: createId("history"),
    activeSpecId: ACTIVE_SPEC_ID,
    entryHour,
    maxGames,
    remainingGames: maxGames,
    currentMachineIndex: 0,
    player: createPlayerState(),
    machines: generateMachines({ spec, entryHour, rng }),
    playOrder: 0,
    isFinished: false,
    finishReason: null,
    endReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function touchGame(game) {
  game.updatedAt = new Date().toISOString();
  return game;
}

export function finishGame(game, reason) {
  game.isFinished = true;
  game.finishReason = reason;
  game.endReason = reason;
  return touchGame(game);
}

export function hasPlayableSave(game) {
  return Boolean(game && !game.isFinished && game.activeSpecId === GAME_CONFIG.activeSpecId);
}

export function hasFinishedSave(game) {
  return Boolean(game && game.isFinished && game.activeSpecId === GAME_CONFIG.activeSpecId);
}
