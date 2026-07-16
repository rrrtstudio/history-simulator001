import assert from "node:assert/strict";
import { formatClockByGames, getMaxGamesForEntry } from "../js/core/time-engine.js";

export default function timeEngineTest() {
  assert.equal(getMaxGamesForEntry(16), 5400);
  assert.equal(getMaxGamesForEntry(22), 600);
  assert.equal(formatClockByGames(22, 600, 600), "22:00");
  assert.equal(formatClockByGames(22, 600, 0), "22:45");
  assert.equal(formatClockByGames(16, 5400, 4600), "17:00");
}
