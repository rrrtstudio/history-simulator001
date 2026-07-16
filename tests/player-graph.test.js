import assert from "node:assert/strict";
import { ensurePlayableCoins } from "../js/core/coin-engine.js";
import {
  closePlayerSegment,
  ensurePlayerGraph,
  recordPlayerGraphPoint,
  startPlayerSegment
} from "../js/core/player-graph.js";

export default function playerGraphTest() {
  const game = createGame();
  const player = game.player;

  ensurePlayerGraph(player);
  ensurePlayableCoins(player, { betPerGame: 3 }, { rentalYen: 1000, rentalCoins: 50 });

  assert.equal(player.coins, 52);
  assert.equal(player.cashInvestmentYen, 1000);
  assert.deepEqual(player.graphPoints, [{ game: 0, difference: 0 }]);
  assert.equal(player.playDifference, 0);

  startPlayerSegment(game, game.machines[0]);
  player.coins -= 3;
  player.totalInCoins += 3;
  player.totalGames += 1;
  game.remainingGames -= 1;
  recordPlayerGraphPoint(game);
  closePlayerSegment(game);

  assert.deepEqual(player.graphPoints.at(-1), { game: 1, difference: -3 });
  assert.equal(player.playSegments.length, 1);
  assert.equal(player.playSegments[0].machineNumber, 101);
  assert.equal(player.playSegments[0].startPlayerGame, 0);
  assert.equal(player.playSegments[0].endPlayerGame, 1);
  assert.equal(player.playSegments[0].difference, -3);

  startPlayerSegment(game, game.machines[1]);
  player.totalOutCoins += 9;
  player.totalGames += 1;
  game.remainingGames -= 1;
  recordPlayerGraphPoint(game);
  closePlayerSegment(game);

  assert.deepEqual(player.graphPoints.at(-1), { game: 2, difference: 6 });
  assert.equal(player.playSegments.length, 2);
  assert.equal(player.playSegments[1].machineNumber, 102);
  assert.equal(player.playSegments[1].startDifference, -3);
  assert.equal(player.playSegments[1].endDifference, 6);
}

function createGame() {
  return {
    entryHour: 20,
    maxGames: 1925,
    remainingGames: 100,
    player: {
      coins: 2,
      cashInvestmentYen: 0,
      cashLentCoins: 0,
      totalInCoins: 0,
      totalOutCoins: 0,
      totalGames: 0
    },
    machines: [
      { id: "machine-1", number: 101 },
      { id: "machine-2", number: 102 }
    ]
  };
}
