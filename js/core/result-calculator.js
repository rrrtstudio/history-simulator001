import { GAME_CONFIG } from "../config/game-config.js?v=20260719-final-table";
import { safeDivide } from "../utils/helpers.js";

export function calculatePlayerResult(game, config = GAME_CONFIG) {
  const player = game.player;
  const finalCoins = Number(player.coins || 0);
  const cashLentCoins = Number(player.cashLentCoins || 0);
  const totalBalanceCoins = finalCoins - cashLentCoins;
  const payoutRate = safeDivide(player.totalOutCoins * 100, player.totalInCoins);

  return {
    entryHour: game.entryHour,
    maxGames: game.maxGames,
    remainingGames: game.remainingGames,
    totalInvestmentYen: player.cashInvestmentYen,
    cashLentCoins,
    finalCoins,
    totalRecoveryCoins: finalCoins,
    totalBalanceCoins,
    referenceYen: totalBalanceCoins * config.yenPerCoin,
    totalGames: player.totalGames,
    playedMachineCount: game.machines.filter((machine) => machine.played).length,
    totalInCoins: player.totalInCoins,
    totalOutCoins: player.totalOutCoins,
    playerDifference: player.totalOutCoins - player.totalInCoins,
    payoutRate
  };
}

export function calculateMachinePlayerResult(machine) {
  const payoutRate = safeDivide(machine.playerOutCoins * 100, machine.playerInCoins);
  return {
    machineNumber: machine.number,
    games: machine.playerGames,
    big: machine.playerBig,
    reg: machine.playerReg,
    inCoins: machine.playerInCoins,
    outCoins: machine.playerOutCoins,
    difference: machine.playerOutCoins - machine.playerInCoins,
    payoutRate
  };
}
