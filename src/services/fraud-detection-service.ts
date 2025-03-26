import { PrismaClient, User, Entry } from '@prisma/client';
import { Logger } from '../utils/logger';

export interface FraudDetectionDependencies {
  prisma: PrismaClient;
  logger: Logger;
}

export class FraudDetectionService {
  private prisma: PrismaClient;
  private logger: Logger;

  // 不正検知のための閾値
  private readonly SUSPICIOUS_ENTRY_THRESHOLD = 5; // 24時間以内の応募回数閾値
  private readonly ACCOUNT_AGE_THRESHOLD = 30; // アカウント年齢の閾値（日数）

  constructor(dependencies: FraudDetectionDependencies) {
    this.prisma = dependencies.prisma;
    this.logger = dependencies.logger;
  }

  /**
   * ユーザーの不正スコアを計算する
   */
  async calculateFraudScore(userId: string): Promise<{
    score: number;
    reasons: string[];
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { entries: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const reasons: string[] = [];
      let score = 0;

      // 1. 応募パターンチェック
      const entryPatternScore = await this.checkEntryPattern(user.entries);
      if (entryPatternScore > 0) {
        score += entryPatternScore;
        reasons.push('不自然な応募パターンを検出');
      }

      // 2. アカウント特性チェック
      const accountScore = await this.checkAccountCharacteristics(user);
      if (accountScore > 0) {
        score += accountScore;
        reasons.push('アカウントの特性が不自然');
      }

      // 3. 関連アカウントチェック
      const relatedScore = await this.checkRelatedAccounts(user);
      if (relatedScore > 0) {
        score += relatedScore;
        reasons.push('関連する不正アカウントを検出');
      }

      await this.logger.info('Fraud score calculated', {
        userId,
        score,
        reasons
      });

      return { score, reasons };

    } catch (error) {
      await this.logger.error('Error calculating fraud score', {
        error,
        userId
      });
      throw error;
    }
  }

  /**
   * 応募パターンをチェックする
   */
  private async checkEntryPattern(entries: Entry[]): Promise<number> {
    let score = 0;

    // 24時間以内の応募回数をチェック
    const recentEntries = entries.filter(entry => {
      const entryTime = new Date(entry.createdAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    });

    if (recentEntries.length > this.SUSPICIOUS_ENTRY_THRESHOLD) {
      score += 30;
    }

    // 応募の時間間隔をチェック
    const suspiciousIntervals = this.checkEntryIntervals(entries);
    if (suspiciousIntervals) {
      score += 20;
    }

    return score;
  }

  /**
   * エントリーの時間間隔をチェックする
   */
  private checkEntryIntervals(entries: Entry[]): boolean {
    if (entries.length < 3) return false;

    const sortedEntries = [...entries].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    // 一定の間隔で応募されているかチェック
    const intervals: number[] = [];
    for (let i = 1; i < sortedEntries.length; i++) {
      const interval = sortedEntries[i].createdAt.getTime() - 
                      sortedEntries[i-1].createdAt.getTime();
      intervals.push(interval);
    }

    // 間隔が一定（ボットの可能性）かチェック
    const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const suspiciouslyRegular = intervals.every(
      interval => Math.abs(interval - averageInterval) < 1000 // 1秒以内の誤差
    );

    return suspiciouslyRegular;
  }

  /**
   * アカウントの特性をチェックする
   */
  private async checkAccountCharacteristics(user: User): Promise<number> {
    let score = 0;

    // アカウント作成日時をチェック
    const accountAge = (new Date().getTime() - user.createdAt.getTime()) / 
                      (1000 * 60 * 60 * 24); // 日数に変換
    if (accountAge < this.ACCOUNT_AGE_THRESHOLD) {
      score += 25;
    }

    return score;
  }

  /**
   * 関連アカウントをチェックする
   */
  private async checkRelatedAccounts(user: User): Promise<number> {
    let score = 0;

    // 同一IPからの応募をチェック
    const relatedEntries = await this.prisma.entry.findMany({
      where: {
        NOT: { userId: user.id },
        // ここでIPアドレスなどの追加チェックを実装可能
      }
    });

    if (relatedEntries.length > 0) {
      score += 25;
    }

    return score;
  }

  /**
   * 不正スコアに基づいてエントリーを無効化する
   */
  async invalidateEntry(entryId: string, fraudScore: number): Promise<void> {
    if (fraudScore >= 50) {
      await this.prisma.entry.update({
        where: { id: entryId },
        data: {
          isValid: false,
          invalidReason: `不正スコア: ${fraudScore}`
        }
      });

      await this.logger.warning('Entry invalidated due to high fraud score', {
        entryId,
        fraudScore
      });
    }
  }
}
