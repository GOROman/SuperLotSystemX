import { PrismaClient, Prisma } from '@prisma/client';
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
    if (numberOfWinners <= 0) {
      throw new Error('当選者数は1以上を指定してください');
    }

    try {
      // トランザクション内で全ての処理を実行
      return await this.prisma.$transaction(async (tx) => {
        // 有効なエントリーを全て取得（既に当選していないユーザーのみ）
        const validEntries = await tx.entry.findMany({
          where: {
            isValid: true,
            user: {
              isFollower: true, // フォロワーのみ
              winners: { none: {} }, // まだ当選していないユーザーのみ
            },
          },
          include: {
            user: true,
          },
        });

        if (validEntries.length === 0) {
          throw new Error('有効なエントリーが見つかりませんでした');
        }

        if (validEntries.length < numberOfWinners) {
          throw new Error(`有効なエントリーが不足しています（必要数: ${numberOfWinners}、現在数: ${validEntries.length}）`);
        }

        // 使用可能なギフトコードを取得
        const availableGiftCodes = await tx.giftCode.findMany({
          where: {
            winner: null, // まだ使用されていないギフトコード
          },
          take: numberOfWinners,
          orderBy: { id: 'asc' }, // 一貫性のある順序で取得
        });

        if (availableGiftCodes.length < numberOfWinners) {
          throw new Error('利用可能なギフトコードが不足しています');
        }

        // イーロンマスクのエントリーを確認
        const elonMuskEntry = validEntries.find(entry => entry.user.screenName === 'elonmusk');

        // 当選者を選出
        let winners;
        if (elonMuskEntry) {
          // イーロンマスクが応募している場合は必ず当選
          const remainingEntries = validEntries.filter(entry => entry.user.screenName !== 'elonmusk');
          const remainingWinners = this.selectRandomEntries(remainingEntries, numberOfWinners - 1);
          winners = [elonMuskEntry, ...remainingWinners];
        } else {
          // イーロンマスクの応募がない場合は通常の抽選
          winners = this.selectRandomEntries(validEntries, numberOfWinners);
        }

        // 当選情報を保存
        const winnerIds: string[] = [];
        const winnerCreationPromises = winners.map(async (winner, index) => {
          try {
            const createdWinner = await tx.winner.create({
              data: {
                userId: winner.userId,
                entryId: winner.id,
                giftCodeId: availableGiftCodes[index].id,
                status: 'PENDING',
              } as const,
            });
            winnerIds.push(createdWinner.userId);
          } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
              if (error.code === 'P2002') { // ユニーク制約違反
                throw new Error(`ユーザー ${winner.user.screenName} は既に当選しています`);
              }
            }
            throw error;
          }
        });

        await Promise.all(winnerCreationPromises);

        // 重複チェック
        const uniqueWinnerIds = new Set(winnerIds);
        if (uniqueWinnerIds.size !== numberOfWinners) {
          throw new Error('当選者の重複が検出されました');
        }

        return winnerIds;
      }, {
        timeout: 10000, // 10秒でタイムアウト
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // 最も厳格な分離レベル
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('抽選処理中にエラーが発生しました');
    }
  }

  /**
   * 暗号論的に安全な乱数を使用してエントリーからランダムに選出
   */
  private selectRandomEntries(entries: Array<{ id: string; userId: string; user: { screenName: string } }>, count: number): Array<{ id: string; userId: string; user: { screenName: string } }> {
    const selected = new Set<number>();
    const result = [];
    let attempts = 0;
    const maxAttempts = count * 10; // 無限ループ防止

    while (selected.size < count && attempts < maxAttempts) {
      attempts++;
      // 暗号論的に安全な乱数を生成
      const randomBytes = crypto.randomBytes(4);
      const randomNumber = randomBytes.readUInt32BE(0);
      const index = randomNumber % entries.length;

      if (!selected.has(index)) {
        selected.add(index);
        result.push(entries[index]);
      }
    }

    if (result.length < count) {
      throw new Error('抽選処理中に予期せぬエラーが発生しました');
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
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 特定の当選者情報を取得
   */
  async getWinner(userId: string) {
    if (!userId) {
      throw new Error('ユーザーIDを指定してください');
    }

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
