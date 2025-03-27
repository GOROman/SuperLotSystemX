import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  const userCount = await prisma.user.count();
  const entryCount = await prisma.entry.count({
    where: {
      isValid: true
    }
  });
  
  console.log('ユーザー数:', userCount);
  console.log('有効な応募数:', entryCount);
  
  await prisma.$disconnect();
}

checkData()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
