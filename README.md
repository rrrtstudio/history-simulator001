# 履歴打ちシミュレーター

既存のDEIGO SERIESとは独立した、専用スペック固定の初期版です。

## 起動

`history-simulator` を静的配信してください。

```bash
python -m http.server 4173
```

その後、`http://localhost:4173/history-simulator/` を開きます。

## 方針

- 画面上に機種名は表示しない
- `activeSpecId` は `"king-deigo"` に固定
- 機種選択画面、未解放機種、準備中機種UIは未実装
- 確率・払い出しは `js/specs/king-deigo-spec.js` に分離
- 共通処理は `js/core/` に配置
- 保存はLocalStorage、スキーマバージョン付き
- `schemaVersion: 1`、`schemaVersion: 2`、`schemaVersion: 3`、`schemaVersion: 4` の保存データは、不足項目を補って `schemaVersion: 5` へ移行
- 区切り到達とボーナス当選は、台画面内の通知でテンポよく表示
- 連チャン、連続判定中、大連チャン、レトロ抽選は台ごとに保存
- 終了済み保存では `isFinished` と `endReason` を保持し、終了後の台確認モードで設定を表示
- 画像はCSS変数と `js/config/asset-config.js` に集約し、操作ボタンはHTML要素として実装

## 主なファイル

- `js/app.js`: 画面遷移とゲーム全体の接続
- `js/specs/king-deigo-spec.js`: 専用スペック
- `js/core/play-engine.js`: 1勝負の進行
- `js/core/coin-engine.js`: 投資、持ちコイン、停止ライン
- `js/core/history-generator.js`: 入店時10台履歴生成
- `js/state/storage.js`: LocalStorage保存
- `css/theme-king-deigo.css`: 後から画像・色を差し替えるテーマ入口

## テスト

```bash
npm test
```

初期版では履歴生成の回転数分布は調整値です。確定仕様ではなく、`js/config/hall-config.js` から変更できる前提です。

## Graph storage notes

- Current saves use `schemaVersion: 5`.
- Saves from `schemaVersion: 1`, `schemaVersion: 2`, `schemaVersion: 3`, and `schemaVersion: 4` are migrated on load.
- Machine slump graphs keep entry-time points and append every player-played game point after entry.
- The final screen player graph is stored separately in `player.graphPoints` and uses player cumulative games on the X axis.
- `js/core/player-graph.js` manages player-only graph points and per-machine play segments.

## GitHub Pages

- Publish the repository root, not only this folder, so `history-simulator/index.html` is served at `/history-simulator/`.
- The simulator uses relative paths such as `./css/...` and `./js/...`, so it can run from the `/history-simulator/` subdirectory.
- The repository root includes `.nojekyll` so GitHub Pages serves static files without Jekyll processing.
- LocalStorage saves are scoped to the public origin and continue to use the existing storage key.
