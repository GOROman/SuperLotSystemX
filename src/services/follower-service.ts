import { PrismaClient, User } from '@prisma/client';
import { Logger } from '../utils/logger';

export class FollowerService {
  private prisma: PrismaClient;
  private logger: Logger;

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * フォロワー情報を更新する
   * @param twitterId Twitter ID
   * @param screenName スクリーンネーム
   * @param profileImage プロフィール画像URL
   * @param isFollower フォロワーかどうか
   */
  async upsertFollower(
    twitterId: string,
    screenName: string,
    profileImage?: string,
    isFollower: boolean = false
  ): Promise<User> {
    try {
      const user = await this.prisma.user.upsert({
        where: { twitterId },
        update: {
          screenName,
          profileImage,
          isFollower,
          followedAt: isFollower ? new Date() : null,
          updatedAt: new Date(),
        },
        create: {
          twitterId,
          screenName,
          profileImage,
          isFollower,
          followedAt: isFollower ? new Date() : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.logger.info('フォロワー情報を更新しました', {
        userId: user.id,
        twitterId,
        screenName,
        isFollower,
      });

      return user;
    } catch (error) {
      this.logger.error('フォロワー情報の更新に失敗しました', {
        twitterId,
        screenName,
        error,
      });
      throw error;
    }
  }

  /**
   * ユーザーがフォロワーかどうかを確認する
   * @param twitterId Twitter ID
   */
  async isFollower(twitterId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { twitterId },
        select: { isFollower: true },
      });

      return user?.isFollower ?? false;
    } catch (error) {
      this.logger.error('フォロワー情報の取得に失敗しました', {
        twitterId,
        error,
      });
      throw error;
    }
  }

  /**
   * フォロワー状態を更新する
   * @param twitterId Twitter ID
   * @param isFollower フォロワーかどうか
   */
  async updateFollowerStatus(twitterId: string, isFollower: boolean): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { twitterId },
        data: {
          isFollower,
          followedAt: isFollower ? new Date() : null,
          updatedAt: new Date(),
        },
      });

      this.logger.info('フォロワー状態を更新しました', {
        userId: user.id,
        twitterId,
        isFollower,
      });

      return user;
    } catch (error) {
      this.logger.error('フォロワー状態の更新に失敗しました', {
        twitterId,
        error,
      });
      throw error;
    }
  }

  /**
   * フォロワー一覧を取得する
   * @param limit 取得件数
   * @param offset オフセット
   */
  async getFollowers(limit: number = 100, offset: number = 0): Promise<User[]> {
    try {
      const followers = await this.prisma.user.findMany({
        where: { isFollower: true },
        orderBy: { followedAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return followers;
    } catch (error) {
      this.logger.error('フォロワー一覧の取得に失敗しました', { error });
      throw error;
    }
  }

  /**
   * フォロワー数を取得する
   */
  async getFollowerCount(): Promise<number> {
    try {
      const count = await this.prisma.user.count({
        where: { isFollower: true },
      });

      return count;
    } catch (error) {
      this.logger.error('フォロワー数の取得に失敗しました', { error });
      throw error;
    }
  }
}
