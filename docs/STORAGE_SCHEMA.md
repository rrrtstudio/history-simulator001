# STORAGE SCHEMA

LocalStorage key:

`deigo-history-simulator:v1`

保存データは `schemaVersion: 5` を持つ。

保存する主な項目:

- 保存データのバージョン
- ゲームID
- 選択機種ID
- 入店時刻
- 最大ゲーム数
- 残りゲーム数
- 現在表示中の台
- プレイヤー状態
- 10台すべての状態
- 入店時グラフ点数
- プレイヤー遊技後に追加されたグラフ
- BIG後フェザー記録
- REGサイドランプ記録
- 連チャン状態
- プレイヤーのレトロ抽選回数と当選回数
- ボーナス履歴ごとの連チャン分類とレトロ結果
- ゲーム終了済みか
- 終了理由（`closed` または `retired`）
- 作成日時
- 更新日時

読み込み時に最低限の検証を行う。`schemaVersion: 1`、`schemaVersion: 2`、`schemaVersion: 3`、`schemaVersion: 4` の保存データは、不足しているグラフ保護点数、フェザー、サイドランプ、連チャン状態、レトロ集計、プレイヤー専用グラフ、終了済み状態の初期値を補って `schemaVersion: 5` として扱う。

## Schema v5 fields

- Current saves use `schemaVersion: 5`.
- Saves from `schemaVersion: 1`, `schemaVersion: 2`, `schemaVersion: 3`, and `schemaVersion: 4` are migrated on load.
- `player.graphPoints`: player-only slump graph points. X is player cumulative games, Y is `totalOutCoins - totalInCoins`.
- `player.playSegments`: play ranges for each machine movement segment.
- `player.activeSegment`: current unfinished segment while playing a machine.
- `player.playDifference`: cached player-only difference.
- `isFinished`: game is closed or retired and should render review-only machine screens.
- `endReason`: `closed` or `retired`.
- Machine `graphPoints` store every player-played game point after the entry-time generated points.
- Machine `gamesSinceBonus` stores normal games since the latest BIG or REG. Bonus-digest games are not added.
