import { PrismaClient, NotificationStatus, WinnerStatus } from '@prisma/client';
import { TwitterService } from './twitter-service';
import { GiftCodeService } from './gift-code-service';

export class NotificationService {
  private prisma: PrismaClient;
  private twitterService: TwitterService;
  private giftCodeService: GiftCodeService;

  constructor(
    prisma: PrismaClient,
    twitterService: TwitterService,
    giftCodeService: GiftCodeService
  ) {
    this.prisma = prisma;
    this.twitterService = twitterService;
    this.giftCodeService = giftCodeService;
  }

  /**
   * 当選者への通知をキューに追加
   */
  async queueNotification(winnerId: string) {
    const winner = await this.prisma.winner.findUnique({
      where: { id: winnerId },
      include: {
        user: true,
        giftCode: true,
      },
    });

    if (!winner) {
      throw new Error(`Winner not found: ${winnerId}`);
    }

    // 既に通知キューが存在する場合はスキップ
    const existingQueue = await this.prisma.notificationQueue.findUnique({
      where: { winnerId: winner.id },
    });

    if (existingQueue) {
      return existingQueue;
    }

    // 通知キューを作成
    return await this.prisma.notificationQueue.create({
      data: {
        winnerId: winner.id,
        giftCodeId: winner.giftCodeId,
        status: NotificationStatus.PENDING,
      },
    });
  }

  /**
   * 保留中の通知を処理
   */
  async processPendingNotifications(batchSize = 10) {
    const pendingNotifications = await this.prisma.notificationQueue.findMany({
      where: {
        status: NotificationStatus.PENDING,
      },
      include: {
        winner: {
          include: {
            user: true,
            giftCode: true,
          },
        },
      },
      take: batchSize,
    });

    for (const notification of pendingNotifications) {
      await this.processNotification(notification.id);
    }
  }

  /**
   * 個別の通知を処理
   */
  async processNotification(notificationId: string) {
    const notification = await this.prisma.notificationQueue.findUnique({
      where: { id: notificationId },
      include: {
        winner: {
          include: {
            user: true,
            giftCode: true,
          },
        },
      },
    });

    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }

    try {
      // ステータスを送信中に更新
      await this.prisma.notificationQueue.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.SENDING },
      });

      // ギフトコードを復号化
      const decryptedCode = await this.giftCodeService.decryptCode(
        notification.winner.giftCode.encryptedCode!
      );

      // DMを送信
      const messageId = await this.twitterService.sendDirectMessage(
        notification.winner.user.twitterId,
        this.createNotificationMessage(
          notification.winner.user.screenName,
          decryptedCode,
          notification.winner.giftCode.amount
        )
      );

      // 送信成功を記録
      await this.prisma.$transaction([
        // 通知キューを更新
        this.prisma.notificationQueue.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.SENT,
            messageId,
            sentAt: new Date(),
          },
        }),
        // 当選情報を更新
        this.prisma.winner.update({
          where: { id: notification.winner.id },
          data: {
            status: WinnerStatus.SENT,
            dmSentAt: new Date(),
            dmMessageId: messageId,
          },
        }),
      ]);
    } catch (error) {
      // エラー時の処理
      const retryCount = (notification.retryCount || 0) + 1;
      const status =
        retryCount >= 3 ? NotificationStatus.FAILED : NotificationStatus.RETRYING;

      await this.prisma.$transaction([
        // 通知キューを更新
        this.prisma.notificationQueue.update({
          where: { id: notification.id },
          data: {
            status,
            retryCount,
            lastError: error instanceof Error ? error.message : String(error),
            lastRetryAt: new Date(),
          },
        }),
        // 当選情報を更新（失敗時のみ）
        ...(status === NotificationStatus.FAILED
          ? [
              this.prisma.winner.update({
                where: { id: notification.winner.id },
                data: { status: WinnerStatus.FAILED },
              }),
            ]
          : []),
      ]);

      throw error;
    }
  }

  /**
   * 通知メッセージを作成
   */
  private createNotificationMessage(
    screenName: string,
    giftCode: string,
    amount: number
  ): string {
    return `
${screenName}様、おめでとうございます！🎉

SuperLotSystemXの抽選に当選されました。
Amazonギフトカード（${amount}円分）をお贈りいたします。

【ギフトコード】
${giftCode}

ギフトコードの使用方法については以下のURLをご確認ください：
https://www.amazon.co.jp/gc/redeem

※このギフトコードには有効期限がございます。お早めにご利用ください。
※このDMへの返信はできません。
※本メッセージは自動送信されています。
    `.trim();
  }

  /**
   * 失敗した通知を再試行
   */
  async retryFailedNotifications(batchSize = 10) {
    const failedNotifications = await this.prisma.notificationQueue.findMany({
      where: {
        status: NotificationStatus.FAILED,
        retryCount: { lt: 3 }, // 3回未満の失敗のみ
      },
      take: batchSize,
    });

    for (const notification of failedNotifications) {
      await this.processNotification(notification.id);
    }
  }

  /**
   * 通知の状態を取得
   */
  async getNotificationStatus(notificationId: string) {
    return await this.prisma.notificationQueue.findUnique({
      where: { id: notificationId },
      include: {
        winner: {
          include: {
            user: true,
            giftCode: true,
          },
        },
      },
    });
  }
}
