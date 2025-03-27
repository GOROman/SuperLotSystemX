import dotenv from 'dotenv';
import prisma from '../prisma/client';

dotenv.config();

interface Winner {
  userId: string;
  screenName: string;
  giftCode: string;
  rank: number;
}

async function exportWinners(): Promise<void> {
  try {
    const winners = await prisma.participant.findMany<{
      userId: string;
      screenName: string;
      giftCode: string | null;
      updatedAt: Date;
    }>({
      where: {
        isWinner: true
      },
      orderBy: {
        updatedAt: 'asc'
      }
    });

    const formattedWinners: Winner[] = winners.map((winner: {
      userId: string;
      screenName: string;
      giftCode: string | null;
    }, index: number): Winner => ({
      userId: winner.userId,
      screenName: winner.screenName,
      giftCode: winner.giftCode || 'PENDING',
      rank: index + 1
    }));

    // JSON形式で出力
    console.log(JSON.stringify({
      drawInfo: {
        timestamp: new Date().toISOString(),
        seedValue: process.env.SEED_VALUE || 'unknown',
        winnerCount: winners.length
      },
      winners: formattedWinners
    }, null, 2));

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportWinners().catch(console.error);
