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

// 通知の詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notification = await notificationService.getNotificationStatus(params.id);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Failed to fetch notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

// 通知の再送信
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await notificationService.processNotification(params.id);
    const updatedNotification = await notificationService.getNotificationStatus(
      params.id
    );
    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Failed to retry notification:', error);
    return NextResponse.json(
      { error: 'Failed to retry notification' },
      { status: 500 }
    );
  }
}
