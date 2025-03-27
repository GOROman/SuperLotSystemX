import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
  console.log('本番データを読み込み中...');

  // CSVファイルを読み込む
  const csvFilePath = path.join(process.cwd(), '.csv', 'goroman_retweet_users.csv');
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
  const records = csv.parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`${records.length}件のユーザーデータを処理中...`);

  // ユーザーとリツイートデータを作成
  for (const record of records) {
    const userId = `user_${record.username}`;
    const retweetId = `rt_${record.username}`;
    const timestamp = new Date(record.timestamp);

    // ユーザーを作成または更新
    await prisma.user.upsert({
      where: { twitterId: record.username },
      update: {
        screenName: record.username,
        isFollower: true,
        updatedAt: new Date()
      },
      create: {
        id: userId,
        twitterId: record.username,
        screenName: record.username,
        isFollower: true,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    });

    // リツイートエントリーを作成
    await prisma.entry.create({
      data: {
        id: retweetId,
        userId: userId,
        retweetId: retweetId,
        retweetedAt: timestamp,
        createdAt: timestamp,
        isValid: true
      }
    });
  }

  // ギフトコードの作成
  console.log('ギフトコードを作成中...');
  const giftCodes = Array.from({ length: 100 }, (_, i) => ({
    id: `code_${String(i + 1).padStart(3, '0')}`,
    code: `GIFT${String(i + 1).padStart(3, '0')}`,
    amount: 1000,
    isUsed: false,
    createdAt: new Date()
  }));

  await prisma.giftCode.createMany({
    data: giftCodes,
    skipDuplicates: true
  });

  console.log('データベースの初期化が完了しました。');
}

main()
  .catch((e) => {
    console.error('エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
