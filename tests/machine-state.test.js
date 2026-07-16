import assert from "node:assert/strict";
import { moveMachine } from "../js/state/machine-state.js";

export default function machineStateTest() {
  const game = {
    currentMachineIndex: 0,
    player: { coins: 77 },
    machines: [
      { id: "a", playerGames: 12 },
      { id: "b", playerGames: 0 }
    ]
  };

  moveMachine(game, 1);
  assert.equal(game.currentMachineIndex, 1);
  assert.equal(game.player.coins, 77);

  moveMachine(game, -1);
  assert.equal(game.currentMachineIndex, 0);
  assert.equal(game.machines[0].playerGames, 12);
}
