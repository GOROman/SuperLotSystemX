import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  // SQLファイルを実行
  console.log('データベースを初期化中...');
  execSync('npx prisma db execute --file ./prisma/seed.sql');
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
