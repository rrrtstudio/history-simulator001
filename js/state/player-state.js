export function createPlayerState() {
  return {
    coins: 0,
    cashInvestmentYen: 0,
    cashLentCoins: 0,
    totalInCoins: 0,
    totalOutCoins: 0,
    totalGames: 0,
    timeConsumedGames: 0,
    bonusConsumedGames: 0,
    playDifference: 0,
    graphPoints: [{ game: 0, difference: 0 }],
    playSegments: [],
    activeSegment: null
  };
}
