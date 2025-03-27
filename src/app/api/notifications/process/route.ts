import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/services/notification-service';
import { TwitterService } from '@/services/twitter-service';
import { GiftCodeService } from '@/services/gift-code-service';

const prisma = new PrismaClient();
const twitterService = new TwitterService();
const giftCodeService = new GiftCodeService();
const notificationService = new NotificationService(
  prisma,
  twitterService,
  giftCodeService
);

// 保留中の通知を処理
export async function POST(request: NextRequest) {
  try {
    const { batchSize } = await request.json();
    await notificationService.processPendingNotifications(batchSize);
    return NextResponse.json({ message: 'Processing started' });
  } catch (error) {
    console.error('Failed to process notifications:', error);
    return NextResponse.json(
      { error: 'Failed to process notifications' },
      { status: 500 }
    );
  }
}

// 失敗した通知の再試行
export async function PUT(request: NextRequest) {
  try {
    const { batchSize } = await request.json();
    await notificationService.retryFailedNotifications(batchSize);
    return NextResponse.json({ message: 'Retry started' });
  } catch (error) {
    console.error('Failed to retry notifications:', error);
    return NextResponse.json(
      { error: 'Failed to retry notifications' },
      { status: 500 }
    );
  }
}
