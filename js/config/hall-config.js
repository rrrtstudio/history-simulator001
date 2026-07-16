export const HALL_CONFIG = {
  machineNumberStart: 101,
  settingDistribution: {
    1: 0.4,
    2: 0.4,
    3: 0.15,
    4: 0.03,
    5: 0.015,
    6: 0.005
  },
  vacantAdjustment: {
    1: 1,
    2: 1,
    3: 1,
    4: 1,
    5: 1,
    6: 1
  },
  historyGeneration: {
    graphCheckpoints: 36,
    totalGamesRangeByEntryHour: {
      16: [1200, 5200],
      17: [1700, 5900],
      18: [2200, 6600],
      19: [2700, 7300],
      20: [3200, 8000],
      21: [3700, 8700],
      22: [4200, 9400]
    }
  }
};
