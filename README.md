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
