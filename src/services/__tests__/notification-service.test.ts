import { PrismaClient, NotificationStatus, WinnerStatus } from '@prisma/client';
import { NotificationService } from '../notification-service';
import { TwitterService } from '../twitter-service';
import { GiftCodeService } from '../gift-code-service';

// モック
jest.mock('../twitter-service');
jest.mock('../gift-code-service');

describe('NotificationService', () => {
  let prisma: PrismaClient;
  let twitterService: jest.Mocked<TwitterService>;
  let giftCodeService: jest.Mocked<GiftCodeService>;
  let notificationService: NotificationService;

  const mockWinner = {
    id: 'winner-1',
    userId: 'user-1',
    giftCodeId: 'gift-1',
    status: WinnerStatus.PENDING,
    notifiedAt: null,
    dmSentAt: null,
    dmMessageId: null,
    createdAt: new Date(),
    user: {
      id: 'user-1',
      twitterId: '12345',
      screenName: 'testuser',
      profileImage: null,
      isFollower: true,
      followedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    giftCode: {
      id: 'gift-1',
      code: 'ABCD-1234',
      encryptedCode: 'encrypted-code',
      amount: 1000,
      isUsed: false,
      createdAt: new Date(),
      usedAt: null,
      expiresAt: null,
      note: null,
    },
  };

  beforeEach(() => {
    prisma = new PrismaClient();
    twitterService = {
      sendDirectMessage: jest.fn(),
    } as any;
    giftCodeService = {
      decryptCode: jest.fn(),
    } as any;
    notificationService = new NotificationService(
      prisma,
      twitterService,
      giftCodeService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('queueNotification', () => {
    it('should create a notification queue for a winner', async () => {
      // モックの設定
      const mockFindUnique = jest.spyOn(prisma.winner, 'findUnique');
      mockFindUnique.mockResolvedValueOnce(mockWinner as any);

      const mockQueueCreate = jest.spyOn(prisma.notificationQueue, 'create');
      mockQueueCreate.mockResolvedValueOnce({
        id: 'queue-1',
        winnerId: mockWinner.id,
        giftCodeId: mockWinner.giftCodeId,
        status: NotificationStatus.PENDING,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        messageId: null,
        lastError: null,
        lastRetryAt: null,
        sentAt: null,
      });

      // テストの実行
      const result = await notificationService.queueNotification(mockWinner.id);

      // 検証
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: mockWinner.id },
        include: { user: true, giftCode: true },
      });
      expect(mockQueueCreate).toHaveBeenCalledWith({
        data: {
          winnerId: mockWinner.id,
          giftCodeId: mockWinner.giftCodeId,
          status: NotificationStatus.PENDING,
        },
      });
      expect(result.status).toBe(NotificationStatus.PENDING);
    });

    it('should throw error if winner not found', async () => {
      // モックの設定
      const mockFindUnique = jest.spyOn(prisma.winner, 'findUnique');
      mockFindUnique.mockResolvedValueOnce(null);

      // テストの実行と検証
      await expect(
        notificationService.queueNotification('non-existent-id')
      ).rejects.toThrow('Winner not found: non-existent-id');
    });
  });

  describe('processNotification', () => {
    it('should successfully process a notification', async () => {
      // モックの設定
      const mockNotification = {
        id: 'notification-1',
        winnerId: mockWinner.id,
        winner: mockWinner,
        giftCodeId: mockWinner.giftCodeId,
        status: NotificationStatus.PENDING,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        messageId: null,
        lastError: null,
        lastRetryAt: null,
        sentAt: null,
      };

      const mockFindUnique = jest.spyOn(prisma.notificationQueue, 'findUnique');
      mockFindUnique.mockResolvedValueOnce(mockNotification as any);

      giftCodeService.decryptCode.mockResolvedValueOnce('decrypted-code');
      twitterService.sendDirectMessage.mockResolvedValueOnce('dm-123');

      const mockTransaction = jest.spyOn(prisma, '$transaction');
      mockTransaction.mockResolvedValueOnce([{}, {}] as any);

      // テストの実行
      await notificationService.processNotification(mockNotification.id);

      // 検証
      expect(giftCodeService.decryptCode).toHaveBeenCalledWith('encrypted-code');
      expect(twitterService.sendDirectMessage).toHaveBeenCalled();
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should handle notification processing failure', async () => {
      // モックの設定
      const mockNotification = {
        id: 'notification-1',
        winnerId: mockWinner.id,
        winner: mockWinner,
        giftCodeId: mockWinner.giftCodeId,
        status: NotificationStatus.PENDING,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        messageId: null,
        lastError: null,
        lastRetryAt: null,
        sentAt: null,
      };

      const mockFindUnique = jest.spyOn(prisma.notificationQueue, 'findUnique');
      mockFindUnique.mockResolvedValueOnce(mockNotification as any);

      const error = new Error('Twitter API error');
      twitterService.sendDirectMessage.mockRejectedValueOnce(error);

      const mockTransaction = jest.spyOn(prisma, '$transaction');
      mockTransaction.mockResolvedValueOnce([{}] as any);

      // テストの実行と検証
      await expect(
        notificationService.processNotification(mockNotification.id)
      ).rejects.toThrow('Twitter API error');

      expect(mockTransaction).toHaveBeenCalled();
      const transactionCalls = mockTransaction.mock.calls[0][0];
      expect(transactionCalls[0]).toMatchObject({
        data: {
          status: NotificationStatus.RETRYING,
          retryCount: 1,
          lastError: 'Twitter API error',
        },
      });
    });
  });
});
