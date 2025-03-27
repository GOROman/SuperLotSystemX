import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse';

const prisma = new PrismaClient();

async function importRetweetUsers() {
  const csvFilePath = path.join(__dirname, '../.csv/goroman_retweet_users.csv');
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

  const parser = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  for await (const record of parser) {
    const { username, timestamp } = record;

    try {
      // 参加者が存在するか確認し、存在しない場合は作成
      const participant = await prisma.participant.upsert({
        where: { userId: username },
        update: {},
        create: {
          userId: username,
          screenName: username,
          isFollower: false,
          isEligible: true,
        },
      });

      // リツイート情報を作成
      await prisma.retweet.create({
        data: {
          tweetId: 'imported_from_csv',
          participantId: participant.id,
          retweetedAt: new Date(timestamp),
        },
      });

      console.log(`ユーザー ${username} のデータをインポートしました`);
    } catch (error) {
      console.error(`ユーザー ${username} のインポートに失敗しました:`, error);
    }
  }

  console.log('インポート完了');
}

// メイン処理の実行
importRetweetUsers()
  .catch((error) => {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
