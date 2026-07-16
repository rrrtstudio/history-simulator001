import assert from "node:assert/strict";
import { calculatePlayerResult } from "../js/core/result-calculator.js";

export default function resultCalculatorTest() {
  const result = calculatePlayerResult({
    entryHour: 16,
    maxGames: 4725,
    remainingGames: 4725,
    player: {
      coins: 0,
      cashInvestmentYen: 0,
      cashLentCoins: 0,
      totalInCoins: 0,
      totalOutCoins: 0,
      totalGames: 0
    },
    machines: []
  });

  assert.equal(result.payoutRate, null);
  assert.equal(Number.isNaN(result.payoutRate), false);
}
