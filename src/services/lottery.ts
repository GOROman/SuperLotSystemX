import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

export class LotteryService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 抽選を実行し、指定された人数の当選者を選出
   * @param numberOfWinners 当選者数
   * @returns 当選者のユーザーID配列
   */
  async drawWinners(numberOfWinners: number): Promise<string[]> {
    // 有効なエントリーを全て取得
    const validEntries = await this.prisma.entry.findMany({
      where: {
        isValid: true,
        user: {
          isFollower: true, // フォロワーのみ
        },
      },
      include: {
        user: true,
      },
    });

    if (validEntries.length === 0) {
      throw new Error('No valid entries found');
    }

    if (validEntries.length < numberOfWinners) {
      throw new Error(`Not enough valid entries. Required: ${numberOfWinners}, Found: ${validEntries.length}`);
    }

    // 暗号論的に安全な乱数を使用して当選者を選出
    const winners = this.selectRandomEntries(validEntries, numberOfWinners);

    // トランザクション内で当選情報を保存
    const winnerIds = await this.prisma.$transaction(async (tx) => {
      const availableGiftCodes = await tx.giftCode.findMany({
        where: {
          winner: null, // まだ使用されていないギフトコード
        },
        take: numberOfWinners,
      });

      if (availableGiftCodes.length < numberOfWinners) {
        throw new Error('Not enough gift codes available');
      }

      const winnerIds: string[] = [];

      for (let i = 0; i < winners.length; i++) {
        const winner = await tx.winner.create({
          data: {
            userId: winners[i].userId,
            giftCodeId: availableGiftCodes[i].id,
            status: 'PENDING',
          },
        });
        winnerIds.push(winner.userId);
      }

      return winnerIds;
    });

    return winnerIds;
  }

  /**
   * 暗号論的に安全な乱数を使用してエントリーからランダムに選出
   */
  private selectRandomEntries(entries: any[], count: number): any[] {
    const selected = new Set<number>();
    const result = [];

    while (selected.size < count) {
      // 暗号論的に安全な乱数を生成
      const randomBytes = crypto.randomBytes(4);
      const randomNumber = randomBytes.readUInt32BE(0);
      const index = randomNumber % entries.length;

      if (!selected.has(index)) {
        selected.add(index);
        result.push(entries[index]);
      }
    }

    return result;
  }

  /**
   * 当選者情報を取得
   */
  async getWinners() {
    return this.prisma.winner.findMany({
      include: {
        user: true,
        giftCode: true,
      },
    });
  }

  /**
   * 特定の当選者情報を取得
   */
  async getWinner(userId: string) {
    return this.prisma.winner.findFirst({
      where: {
        userId,
      },
      include: {
        user: true,
        giftCode: true,
      },
    });
  }
}
