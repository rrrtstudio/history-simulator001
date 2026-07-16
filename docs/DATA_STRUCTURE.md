# DATA STRUCTURE

## Game

- `schemaVersion`
- `gameId`
- `activeSpecId`
- `entryHour`
- `maxGames`
- `remainingGames`
- `currentMachineIndex`
- `player`
- `machines`
- `isFinished`
- `finishReason`
- `createdAt`
- `updatedAt`

## Player

- `coins`
- `cashInvestmentYen`
- `cashLentCoins`
- `totalInCoins`
- `totalOutCoins`
- `totalGames`
- `playDifference`
- `graphPoints`
- `playSegments`
- `activeSegment`

## Machine

- `id`
- `number`
- `specId`
- `hiddenSetting`
- `entryTotalGames`
- `currentTotalGames`
- `entryBig`
- `currentBig`
- `entryReg`
- `currentReg`
- `entryDifference`
- `currentDifference`
- `gamesSinceBonus`
- `graphPoints`
- `entryGraphPointCount`
- `playerGames`
- `playerBig`
- `playerReg`
- `playerRoleCounts`
- `playerHintCounts`
- `latestHints`
- `chainState`
- `playerRetroStats`
- `played`
- `lastPlayedOrder`

未遊技台は入店時データから勝手に進行しない。

## ChainState

- `state`: `normal`, `chain-pending`, `renchan`, `dairenchan`
- `originBig`
- `lastBonusGame`
- `lastBonusType`
- `lastBonusIntervalGames`
- `chainBigCount`
- `chainRegCount`
- `chainBonusCount`
- `lastBonusStatus`
- `lastRetroHit`
