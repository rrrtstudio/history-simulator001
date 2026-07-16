import { validateSpec } from "./spec-interface.js";

function withRemainderRate(remainderKey, rates) {
  const used = Object.values(rates).reduce((sum, rate) => sum + Number(rate || 0), 0);
  return { [remainderKey]: Math.max(0, 1 - used), ...rates };
}

export const KING_DEIGO_SPEC = validateSpec({
  id: "king-deigo",
  displayName: "KING DEIGO",
  settings: [1, 2, 3, 4, 5, 6],
  betPerGame: 3,
  roles: [
    {
      id: "bell",
      label: "ベル",
      probability: { 1: 7.149, 2: 7.14, 3: 7.139, 4: 7.002, 5: 6.946, 6: 6.91 },
      payout: 9
    },
    {
      id: "replay",
      label: "リプレイ",
      probability: 7.298,
      payout: 0,
      isReplay: true
    },
    {
      id: "watermelon",
      label: "スイカ",
      probability: 160.23,
      payout: 6
    },
    {
      id: "cherry",
      label: "チェリー",
      probability: 48.01,
      payout: 4
    }
  ],
  displayRoleIds: ["bell", "replay", "watermelon", "cherry"],
  bonus: {
    big: {
      label: "BIG",
      probability: { 1: 292, 2: 280, 3: 268, 4: 257, 5: 244, 6: 232 },
      payout: 260
    },
    reg: {
      label: "REG",
      probability: { 1: 489, 2: 452, 3: 420, 4: 390, 5: 360, 6: 332 },
      payout: 120
    }
  },
  bonusOverlap: {
    cherryDuplicateRate: 0.05
  },
  bonusGame: {
    big: {
      games: 20,
      betPerGame: 1,
      payoutPerGame: 14,
      roles: [
        {
          id: "bigWatermelon",
          label: "BIG中スイカ",
          probability: { 1: 47.127, 2: 42.864, 3: 39.667, 4: 36.991, 5: 34.707, 6: 31.266 }
        }
      ],
      cherry: 0,
      miss: 0
    },
    reg: {
      games: 10,
      betPerGame: 2,
      payoutPerGame: 14
    }
  },
  hints: {
    regSideLamp: {
      colors: ["blue", "yellow", "green", "red", "rainbow"],
      rates: {
        1: { blue: 0.35994, yellow: 0.23991, green: 0.23991, red: 0.16002, rainbow: 0.00021 },
        2: { blue: 0.2319, yellow: 0.34781, green: 0.16789, red: 0.25191, rainbow: 0.00049 },
        3: { blue: 0.33569, yellow: 0.2238, green: 0.26369, red: 0.17581, rainbow: 0.00101 },
        4: { blue: 0.21556, yellow: 0.32336, green: 0.18365, red: 0.27545, rainbow: 0.00197 },
        5: { blue: 0.31076, yellow: 0.20718, green: 0.28691, red: 0.19124, rainbow: 0.00391 },
        6: { blue: 0.24805, yellow: 0.24805, green: 0.24805, red: 0.24805, rainbow: 0.00781 }
      }
    },
    bigEndFeather: {
      colors: ["white", "blue", "yellow", "green", "red", "rainbow"],
      rates: {
        1: withRemainderRate("white", { blue: 0.0367, yellow: 0.0287, green: 0.0192, red: 0.0128, rainbow: 0.0001 }),
        2: withRemainderRate("white", { blue: 0.0406, yellow: 0.0301, green: 0.0207, red: 0.0137, rainbow: 0.0004 }),
        3: withRemainderRate("white", { blue: 0.043, yellow: 0.0353, green: 0.0233, red: 0.015, rainbow: 0.0006 }),
        4: withRemainderRate("white", { blue: 0.0488, yellow: 0.0385, green: 0.0252, red: 0.0157, rainbow: 0.0007 }),
        5: withRemainderRate("white", { blue: 0.0536, yellow: 0.041, green: 0.0267, red: 0.0174, rainbow: 0.002 }),
        6: withRemainderRate("white", { blue: 0.0577, yellow: 0.045, green: 0.0307, red: 0.0189, rainbow: 0.004 })
      }
    },
    regEndFeather: {
      colors: ["white", "blue", "yellow", "green", "red", "rainbow"],
      rates: null
    }
  },
  renchan: {
    windowGames: 100,
    dairenchanStartBigCount: 5,
    retroRates: { 1: 0.0619, 2: 0.0741, 3: 0.0802, 4: 0.0934, 5: 0.1052, 6: 0.1293 },
    source: "既存DEIGO SERIESのMACHINE_CONFIG.retro.rates"
  },
  historyGeneration: {
    note: "入店時履歴の回転数分布は初期調整値。ホール設定側から変更する。"
  }
});
