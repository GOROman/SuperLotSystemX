import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, NotificationStatus } from '@prisma/client';
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

// 通知一覧の取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as NotificationStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [notifications, total] = await Promise.all([
      prisma.notificationQueue.findMany({
        where,
        include: {
          winner: {
            include: {
              user: true,
              giftCode: {
                select: {
                  amount: true,
                  expiresAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notificationQueue.count({ where }),
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// 新規通知の作成
export async function POST(request: NextRequest) {
  try {
    const { winnerId } = await request.json();

    if (!winnerId) {
      return NextResponse.json(
        { error: 'Winner ID is required' },
        { status: 400 }
      );
    }

    const notification = await notificationService.queueNotification(winnerId);
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
