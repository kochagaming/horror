# 怪異監視センター

市内の監視映像・通報・SNS・ログ・内部資料を調査し、受信案件を分類する短編ホラー監視ゲームです。プレイヤーは特異事象監視室の新人夜間監視員として、22:00から05:00までの一晩を担当します。

現在のプロトタイプは、タイトル画面から7件の通常事件、特別事案 #0000、3種類のエンディングまで通してプレイできます。後から事件、資料、演出、画像、音声を追加しやすいよう、シナリオデータ・状態管理・画面を分離しています。

## 使用技術

- TypeScript / React 19
- Vinext（Next.js App Router互換）+ Vite
- Tailwind CSS 4 と Shadcn UIプリミティブ
- localStorage（端末内セーブ）
- OpenAI Sites（静的ホスティング）

バックエンドやデータベースは使用していません。

## 起動方法

Node.js 22.13以降と pnpm を使用します。

```bash
pnpm install
pnpm dev
```

表示されたローカルURLをブラウザで開いてください。本番ビルドは次のコマンドです。

```bash
pnpm build
```

## ディレクトリ構成

```text
app/
  globals.css         端末UI・レスポンシブ表示・ホラー演出
  layout.tsx          メタデータとフォント
  page.tsx            ゲーム画面の入口
components/
  game-app.tsx        タイトル、調査画面、判定、エンディングUI
  ui/                 Shadcn UIプリミティブ
data/
  incidents.ts        事件・証拠・解放条件・イベント
  documents.ts        内部資料
  messages.ts         共通文言と判定名
  endings.ts          エンディング文章
  assets.ts           画像・音声パスの台帳
  types.ts            データ形式とゲーム状態
lib/
  game-engine.ts      進行、イベント実行、判定、保存
public/assets/
  images/             監視画像・人物画像・ノイズ
  audio/              音声・SE・環境音
```

## ゲーム状態

`GameState` は `data/types.ts` で定義しています。主な項目は次のとおりです。

- `currentTime` / `currentIncidentId`: 現在時刻と案件
- `processedIncidents`: 処理済み案件ID
- `incidentJudgements`: 案件ごとの判定結果
- `flags`: 演出・解放・分岐に使う汎用フラグ
- `unlockedDocuments`: 解放済み内部資料
- `anomalyLevel`: 観測による異常固定度
- `endingFlags` / `endingId`: 到達済み・現在のエンディング
- `viewedEvidence`: 閲覧した資料ID
- `systemLog`: 画面右下の直近ログ

状態更新は `lib/game-engine.ts` の純粋関数へ集約しています。UIから事件の順序や分岐を直接操作しないため、シナリオ追加時の影響範囲を限定できます。

## 事件を追加する

1. `data/incidents.ts` の `INCIDENTS` に `Incident` を1件追加します。
2. `id`、表示時刻、概要、場所、優先度、証拠、許可する判定を設定します。
3. `unlockCondition.after` に直前の事件IDを指定します。
4. 必要なら `onOpen` / `onJudge` にイベントを追加します。

基本的な事件はデータ追加だけで進行します。画面側へ事件固有の分岐を書く必要はありません。

## 資料を追加する

1. `data/documents.ts` の `DOCUMENTS` に資料を追加します。
2. 解放したい事件のイベントへ `{ type: 'unlockDocument', documentId: '資料ID' }` を設定します。
3. 総数や表示は自動更新されます。

## 分岐条件を追加する

通常判定後の変化は、事件データの `onJudge` に判定ごとのイベントを設定します。新しい条件式が必要な場合は `lib/game-engine.ts` の `canUseJudgement` に条件を追加してください。

隠し選択肢「記録を破棄する」は、`flags.recordBreakReady === true` の場合だけ表示される仕組みまで実装済みです。今後、資料の全閲覧や特定の判定履歴を検査してこのフラグを立てれば、隠しエンディングを解放できます。

## ホラー演出を追加する

事件の `onOpen` / `onJudge` から `GameEvent` を実行します。現在は次を使用できます。

- `setFlag`: UI項目や分岐用のフラグ更新
- `unlockDocument`: 内部資料の解放
- `addLog`: システムログ追加
- `glitch`: 一時的な画面異常と警告表示
- `increaseAnomaly`: 異常度の更新

新しい演出は `data/types.ts` の `GameEvent` に型を追加し、`lib/game-engine.ts` の `applyEvents` に処理を1件追加します。CSS演出は `app/globals.css` にまとめます。

## 画像・音声を追加する

- 画像: `public/assets/images/`
- 音声: `public/assets/audio/`
- 公開パスの台帳: `data/assets.ts`

事件の証拠に `asset` などの任意フィールドを追加し、`components/game-app.tsx` の証拠ビューで参照します。素材がない現在は、監視画面をCSSプレースホルダーで描画しています。

## セーブデータ仕様

- 保存先: ブラウザの `localStorage`
- キー: `kaii-monitor-center-save-v1`
- 保存タイミング: ゲーム状態が変わるたびに自動保存
- `CONTINUE`: 有効なバージョン1セーブがある場合だけ有効
- `RESET SAVE`: 確認ダイアログ後に保存を削除

データには `version` を持たせています。将来形式を変更する場合は、`loadState` で旧バージョンからの移行処理を追加してください。

## 現在の仮実装

- 監視映像はCSSによる抽象的なプレースホルダーです。
- 通報音声、環境音、SEは未収録です。
- シナリオ文章はプロトタイプ用の初稿です。
- 「未観測」エンディングは条件フラグと分岐先だけ用意しており、通常プレイでは解放されません。
