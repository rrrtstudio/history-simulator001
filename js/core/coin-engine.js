export function calculateStopLine(currentCoins) {
  const coins = Math.max(0, Math.floor(Number(currentCoins) || 0));
  const baseLine = Math.floor(coins / 50) * 50;
  if (baseLine > 0 && coins - baseLine <= 2) {
    return baseLine - 50;
  }
  return baseLine;
}

export function isInStopRange(currentCoins, stopLine) {
  const coins = Math.floor(Number(currentCoins) || 0);
  const line = Math.max(0, Number(stopLine) || 0);
  return coins >= line && coins <= line + 2;
}

export function ensurePlayableCoins(player, spec, config) {
  const beforeCoins = player.coins;
  if (player.coins >= spec.betPerGame) {
    return { investedYen: 0, lentCoins: 0, beforeCoins, afterCoins: player.coins };
  }

  player.cashInvestmentYen += config.rentalYen;
  player.cashLentCoins += config.rentalCoins;
  player.coins += config.rentalCoins;

  return {
    investedYen: config.rentalYen,
    lentCoins: config.rentalCoins,
    beforeCoins,
    afterCoins: player.coins
  };
}
