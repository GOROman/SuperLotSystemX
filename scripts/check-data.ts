import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  const participantCount = await prisma.participant.count();
  const retweetCount = await prisma.retweet.count();
  
  console.log('Participants:', participantCount);
  console.log('Retweets:', retweetCount);
  
  await prisma.$disconnect();
}

checkData()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
