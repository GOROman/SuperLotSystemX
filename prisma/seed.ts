import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  // SQLファイルを実行
  console.log('キャンペーンデータを作成中...');
  execSync('npx prisma db execute --file ./prisma/seed.sql');
  
  console.log('参加者データを作成中...');
  execSync('npx prisma db execute --file ./prisma/seed_real_participants.sql');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
