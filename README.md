# SuperLotSystemX 🎉

@GOROman フォロワー5万人突破記念 Amazonギフト券プレゼントキャンペーンシステム

![image](https://github.com/user-attachments/assets/2da3d557-5b7d-4ae8-bf94-15c3fdba22ad)


## 概要

本システムは、GOROmanのTwitterフォロワー数5万人突破を記念したキャンペーンの運営を自動化するためのシステムです。

### キャンペーン詳細
- 賞品：Amazonギフト券15円分
- 当選人数：10名
- 実施期間：2025年3月26日〜
- ハッシュタグ：#五万人突破

## 主な機能

- Twitter API v2を使用したフォロワー情報の取得
- キャンペーン投稿のリポスト（RT）チェック
- AIによる公平な抽選システム
- 当選者リストの生成とDMメッセージテンプレートの提供
- リアルタイムモニタリング機能

## 技術スタック

- 言語：TypeScript
- フレームワーク：Node.js
- データベース：SQLite（Prisma ORM）
- API：Twitter API v2

## セットアップ

### 必要条件
- Node.js 18.x以上
- Twitter API v2アクセストークン

### インストール手順

1. リポジトリのクローン
```bash
git clone https://github.com/GOROman/SuperLotSystemX.git
cd SuperLotSystemX
```

2. 依存パッケージのインストール
```bash
npm install
```

## 抽選の実行方法

### GitHub Actionsを使用した抽選

1. GitHubリポジトリの「Actions」タブを開きます
2. 「Lottery Draw」ワークフローを選択します
3. 「Run workflow」ボタンをクリックします
4. 以下のパラメータを入力します：
   - シード値（例: 565656）
   - 当選者数（デフォルト: 10）
5. 「Run workflow」をクリックして抽選を開始します

### 抽選結果の確認

抽選が完了すると、以下の形式で結果が保存されます：

1. GitHub Releasesに新しいリリースが作成されます
   - タグ名: `lottery-{シード値}`
   - 添付ファイル:
     - `lottery-result.txt`: 抽選結果の詳細（当選者リストとDMメッセージ）
     - `winners.json`: 当選者データのJSON形式

2. GitHub Actionsの実行結果からもアーティファクトとしてダウンロード可能です

### ローカルでの抽選実行

```bash
# データベースのセットアップ
npx prisma migrate deploy
npm run prisma:seed

# 抽選の実行
SEED_VALUE=565656 npx ts-node scripts/campaign-manager.ts
```

## 抽選の仕組み

1. シード値を使用した乱数生成
   - xorshiftアルゴリズムによる予測可能な乱数生成
   - 同じシード値で同じ結果を再現可能

2. Fisher-Yatesシャッフル
   - 公平な抽選を実現するアルゴリズム
   - 参加者リストをランダムにシャッフル

3. 当選者の選出
   - シャッフルされたリストから指定数の当選者を選出
   - 重複なしで公平な抽選を実現

3. 環境変数の設定
```bash
cp .env.example .env
# .envファイルを編集してTwitter APIキーなどを設定
```

4. データベースのセットアップ
```bash
npx prisma migrate dev
```

5. アプリケーションの起動
```bash
npm run dev
```

## 開発ガイドライン

- 開発はfeatureブランチで実施
- mainブランチへの直接プッシュは禁止
- プルリクエスト必須

## セキュリティ対策

- ギフト券コードの暗号化保存
- 不正アクセス防止機能
- 定期的なデータバックアップ
- システムログの保存

## ライセンス

MIT License

## 作者

GOROman
