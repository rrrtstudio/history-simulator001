import assert from "node:assert/strict";
import { calculateStopLine, ensurePlayableCoins } from "../js/core/coin-engine.js";

export default function coinEngineTest() {
  const cases = [
    [52, 0],
    [98, 50],
    [102, 50],
    [148, 100],
    [250, 200],
    [252, 200],
    [290, 250],
    [347, 300]
  ];

  for (const [coins, expected] of cases) {
    assert.equal(calculateStopLine(coins), expected);
  }

  const player = { coins: 2, cashInvestmentYen: 0, cashLentCoins: 0 };
  const result = ensurePlayableCoins(player, { betPerGame: 3 }, { rentalYen: 1000, rentalCoins: 50 });
  assert.equal(result.investedYen, 1000);
  assert.equal(player.coins, 52);
  assert.equal(player.cashInvestmentYen, 1000);
  assert.equal(player.cashLentCoins, 50);
}
