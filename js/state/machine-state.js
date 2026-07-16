import { normalizeMachineIndex } from "../utils/validation.js";

export function getCurrentMachine(game) {
  return game.machines[game.currentMachineIndex];
}

export function moveMachine(game, direction) {
  game.currentMachineIndex = normalizeMachineIndex(game.currentMachineIndex + direction, game.machines.length);
  return getCurrentMachine(game);
}

export function moveToMachine(game, machineId) {
  const index = game.machines.findIndex((machine) => machine.id === machineId);
  if (index >= 0) game.currentMachineIndex = index;
  return getCurrentMachine(game);
}
