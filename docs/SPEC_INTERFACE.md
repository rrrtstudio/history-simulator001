# SPEC INTERFACE

スペックは共通エンジンへ渡すデータオブジェクトとして扱う。

必須項目:

- `id`
- `displayName`
- `settings`
- `betPerGame`
- `roles`
- `displayRoleIds`
- `bonus`

役定義:

- `id`
- `label`
- `probability`
- `payout`
- `isReplay`

ボーナス定義:

- `probability`
- `payout`

連チャン定義:

- `windowGames`
- `dairenchanStartBigCount`
- `retroRates`
- `source`

KING DEIGO固有の確率、払い出し、BIG中スイカ、示唆系の構造は `king-deigo-spec.js` に置く。共通エンジンにはKING DEIGOの役名や確率を直接埋め込まない。
