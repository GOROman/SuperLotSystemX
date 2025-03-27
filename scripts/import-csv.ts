import fs from 'fs';
import { parse } from 'csv-parse/sync';
import prisma from '../prisma/client';

async function main() {
  try {
    // CSVファイルの読み込み
    const csvContent = fs.readFileSync('.csv/goroman_retweet_users.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    console.log(`${records.length}件のデータを読み込みました。`);

    // データベースに登録
    for (const record of records) {
      // ユーザーの作成または取得
      const user = await prisma.user.upsert({
        where: {
          twitterId: record.username
        },
        create: {
          twitterId: record.username,
          screenName: record.username,
          isFollower: true,
          createdAt: new Date(record.timestamp),
          updatedAt: new Date(record.timestamp)
        },
        update: {}
      });

      // 応募の作成
      await prisma.entry.create({
        data: {
          userId: user.id,
          retweetId: 'rt_001',
          retweetedAt: new Date(record.timestamp),
          createdAt: new Date(record.timestamp),
          isValid: true
        }
      });
    }

    console.log('データベースへの登録が完了しました。');
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
