import { PrismaClient, Entry, User } from '@prisma/client';
import { TwitterService } from './twitter';
import { FollowerService } from './follower-service';
import { SystemLogger } from '../utils/logger';

export class CampaignService {
  private prisma: PrismaClient;
  private twitter: TwitterService;
  private followerService: FollowerService;
  private logger: SystemLogger;

  constructor() {
    this.prisma = new PrismaClient();
    this.twitter = new TwitterService();
    this.followerService = new FollowerService();
    this.logger = new SystemLogger();
  }

  /**
   * リツイート情報を取得し、エントリーを作成する
   */
  async processRetweet(tweetId: string, userId: string): Promise<Entry> {
    try {
      // リツイート情報を取得
      const retweetInfo = await this.twitter.getRetweetInfo(tweetId, userId);
      
      // 応募資格のチェック
      const isEligible = await this.checkEligibility(userId);
      
      if (!isEligible.valid) {
        return this.createInvalidEntry(userId, tweetId, isEligible.reason);
      }

      // 有効なエントリーを作成
      const entry = await this.prisma.entry.create({
        data: {
          userId,
          retweetId: tweetId,
          retweetedAt: new Date(retweetInfo.created_at),
          isValid: true
        }
      });

      await this.logger.info('New entry created', { entryId: entry.id, userId });
      return entry;

    } catch (error) {
      await this.logger.error('Error processing retweet', { error, userId, tweetId });
      throw error;
    }
  }

  /**
   * ユーザーの応募資格をチェックする
   */
  private async checkEligibility(userId: string): Promise<{ valid: boolean; reason?: string }> {
    try {
      // フォロワーチェック
      const isFollower = await this.followerService.isFollower(userId);
      if (!isFollower) {
        return { valid: false, reason: 'ユーザーがフォローしていません' };
      }

      // 重複応募チェック
      const duplicateEntry = await this.checkDuplicateEntry(userId);
      if (duplicateEntry) {
        return { valid: false, reason: '既に応募済みです' };
      }

      return { valid: true };

    } catch (error) {
      await this.logger.error('Error checking eligibility', { error, userId });
      throw error;
    }
  }

  /**
   * 重複応募をチェックする
   */
  private async checkDuplicateEntry(userId: string): Promise<boolean> {
    const existingEntry = await this.prisma.entry.findFirst({
      where: {
        userId,
        isValid: true,
        createdAt: {
          // 24時間以内の応募をチェック
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    return !!existingEntry;
  }

  /**
   * 無効なエントリーを作成する
   */
  private async createInvalidEntry(
    userId: string,
    retweetId: string,
    reason: string
  ): Promise<Entry> {
    return this.prisma.entry.create({
      data: {
        userId,
        retweetId,
        retweetedAt: new Date(),
        isValid: false,
        invalidReason: reason
      }
    });
  }

  /**
   * キャンペーンの統計情報を取得する
   */
  async getCampaignStats(): Promise<{
    totalEntries: number;
    validEntries: number;
    invalidEntries: number;
    uniqueParticipants: number;
  }> {
    const [totalEntries, validEntries, invalidEntries, uniqueParticipants] = await Promise.all([
      this.prisma.entry.count(),
      this.prisma.entry.count({ where: { isValid: true } }),
      this.prisma.entry.count({ where: { isValid: false } }),
      this.prisma.entry.groupBy({
        by: ['userId'],
        where: { isValid: true },
        _count: true
      }).then(groups => groups.length)
    ]);

    return {
      totalEntries,
      validEntries,
      invalidEntries,
      uniqueParticipants
    };
  }
}
