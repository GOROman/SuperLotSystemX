# データベース設計ドキュメント

## テーブル構成

### User（ユーザー情報）
- id: ユニークID (CUID)
- twitterId: Twitter ID（ユニーク）
- screenName: Twitterスクリーンネーム
- isFollower: フォロワーフラグ
- createdAt: 作成日時
- updatedAt: 更新日時

### Entry（応募エントリー）
- id: ユニークID (CUID)
- userId: ユーザーID（外部キー）
- retweetId: リツイートID
- createdAt: 作成日時
- isValid: 有効フラグ

### Winner（当選者情報）
- id: ユニークID (CUID)
- userId: ユーザーID（外部キー）
- giftCodeId: ギフトコードID（外部キー）
- notifiedAt: 通知日時
- dmSentAt: DM送信日時
- createdAt: 作成日時

### GiftCode（Amazonギフト券コード）
- id: ユニークID (CUID)
- code: ギフトコード（暗号化）
- isUsed: 使用済みフラグ
- createdAt: 作成日時
- usedAt: 使用日時

## リレーション

1. User - Entry (1:N)
   - ユーザーは複数の応募エントリーを持つことができる

2. User - Winner (1:N)
   - ユーザーは複数回当選する可能性がある（将来のキャンペーン用）

3. Winner - GiftCode (1:1)
   - 当選情報は1つのギフトコードと紐づく
   - ギフトコードは1つの当選情報にのみ紐づく

## セキュリティ考慮事項

1. ギフトコードの暗号化
   - コードはデータベースに保存する前に暗号化
   - 環境変数で暗号化キーを管理

2. アクセス制御
   - データベースアクセスは認証済みのバックエンドからのみ許可
   - 環境変数でデータベース接続情報を管理

## インデックス

1. User
   - twitterId（ユニーク）: 高速なユーザー検索用

2. Entry
   - [userId, retweetId]（ユニーク）: 重複応募防止用

3. GiftCode
   - code（ユニーク）: 重複コード防止用

## バックアップ戦略

1. 定期バックアップ
   - 1日1回の完全バックアップ
   - 1時間ごとの差分バックアップ

2. バックアップデータの暗号化
   - バックアップファイルも暗号化して保存

## 監視項目

1. パフォーマンス
   - クエリ実行時間
   - コネクション数
   - ディスク使用量

2. セキュリティ
   - 失敗したログイン試行
   - 異常なクエリパターン
   - データベースアクセスログ
