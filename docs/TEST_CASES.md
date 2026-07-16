# TEST CASES

## 実装済みテスト

- 52枚からの停止基準は0枚
- 98枚、102枚からの停止基準は50枚
- 148枚からの停止基準は100枚
- 250枚、252枚からの停止基準は200枚
- 290枚からの停止基準は250枚
- 347枚からの停止基準は300枚
- 持ちコイン2枚で勝負準備すると1000円投資、52枚になる
- 22時入店の最大ゲーム数は600G
- 台移動してもプレイヤーの持ちコインを保持する
- 総投入0枚でも機械割がNaNにならない
- 同じ乱数シードで同じ入店時履歴になる
- 入店時グラフ点が遊技後の保存上限処理でも保持される
- グラフY軸の最低範囲が±1000枚になる
- グラフY軸が最大絶対差枚から1000枚単位で切り上がる
- ボーナス当選後にBIG後フェザーまたはREGサイドランプを記録できる
- `schemaVersion: 1` の保存データへ新しい初期値を補える
- 通常REGは連チャン開始せず、レトロ抽選しない
- 通常BIGはCHAIN_PENDINGへ移行し、BIG通算1回になる
- 通常BIG後100G以内のBIGは連チャンBIGになり、レトロ抽選対象になる
- 通常BIG後100G以内のREGは通常REGのまま、連続判定を維持する
- 通常BIG、REG、BIGの最後のBIGは連チャンBIGになる
- RENCHAN中のREGは連チャンREGになり、レトロ抽選対象になる
- 101GのREGは通常REGになり、以前の連チャン状態を終了する
- 101GのBIGは通常BIGになり、新しいCHAIN_PENDINGを開始する
- BIG通算5回目は大連チャンBIGになり、レトロ抽選しない
- DAIRENCHAN中のREGは大連チャンREGになり、レトロ抽選しない
- DAIRENCHANは非当選101G到達でNORMALへ戻る

## 手動確認項目

- 保存後に再読み込みして状態が一致する
- 退店確認を挟まず最終結果へ進まない
- 区切り到達時に専用画面へ移動せず、台画面内通知だけが出る
- スマートフォン幅で主要ボタンが押しやすい
- GitHub Pagesの相対パスで読み込める
## Graph regression tests

- Machine graph storage keeps every player-played game point; render thinning preserves first, last, peak, and trough points.
- Player graph starts at 0G / 0 coins and uses `totalOutCoins - totalInCoins`.
- Cash lending does not raise the player graph.
- Player play segments record machine number, start/end player games, and start/end difference.
- Finished machine review screens show the setting and do not show play buttons.
- Final result screen exposes both "もう一度遊ぶ" and "終了" actions.
- Bonus digest games consume remaining time but do not increase machine total games or player total games.
- README and storage schema current-save versions match `SCHEMA_VERSION`.
- Player-facing UI files do not contain `KING DEIGO` or `キングデイゴ`.
- Machine number header exposes previous/next controls in normal and finished review modes.
- A result notice does not remove or disable the normal "勝負する" action.
- Two consecutive rounds can update games, coins, difference, and bonus history while remaining before closing.
- Confirming the end-of-play dialog clears the save, resets in-memory game state, and returns directly to entry-time selection.
- Final result summary uses a compact two-column grid.
- Finished review previous/next controls rerender the selected machine data and wrap 101/110.
- Machine screens show current normal games since the latest bonus in normal and finished review modes.
- Final result screens and the final ten-machine table do not show current games since bonus.
- Entry-time generated machines include exactly nine machines at 100+ games since bonus and one machine at 0-99 games.
- In-play exit buttons are labeled "退店（終了）" and lead to finished machine review, not directly to the title screen.
- Final result "もう一度遊ぶ" clears the current save and opens entry-time selection.
- Final result "終了" clears the current save and returns to the title screen.
