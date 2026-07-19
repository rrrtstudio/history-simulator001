import { STORAGE_KEY } from "../utils/constants.js?v=20260719-final-table-compact";
import { deepClone } from "../utils/helpers.js";
import { isValidGameSave, migrateGameSave } from "../utils/validation.js?v=20260719-final-table-compact";
import { touchGame } from "./game-state.js?v=20260719-final-table-compact";

export function loadSavedGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const migrated = migrateGameSave(parsed);
    return isValidGameSave(migrated) ? migrated : null;
  } catch {
    return null;
  }
}

export function saveGame(game) {
  const clone = deepClone(touchGame(game));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
}

export function clearSavedGame() {
  localStorage.removeItem(STORAGE_KEY);
}
