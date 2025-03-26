import { PrismaClient, Entry, User } from '@prisma/client';
import { FraudDetectionService, FraudDetectionDependencies } from '../fraud-detection-service';
import { Logger } from '../utils/logger';

// モック
jest.mock('@prisma/client');

describe('FraudDetectionService', () => {
  let fraudDetectionService: FraudDetectionService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn()
      },
      entry: {
        findMany: jest.fn(),
        update: jest.fn()
      }
    } as unknown as jest.Mocked<PrismaClient>;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warning: jest.fn()
    };

    const dependencies: FraudDetectionDependencies = {
      prisma: mockPrisma,
      logger: mockLogger
    };

    fraudDetectionService = new FraudDetectionService(dependencies);
  });

  describe('calculateFraudScore', () => {
    const mockUserId = 'user-123';

    it('新規アカウントに対して高いスコアを返す', async () => {
      const mockUser: User = {
        id: mockUserId,
        twitterId: 'twitter-123',
        screenName: 'testuser',
        profileImage: null,
        isFollower: true,
        followedAt: new Date(),
        createdAt: new Date(), // 新規アカウント
        updatedAt: new Date()
      };

      const mockEntries: Entry[] = [];

      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        entries: mockEntries
      });

      const result = await fraudDetectionService.calculateFraudScore(mockUserId);

      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons).toContain('アカウントの特性が不自然');
    });

    it('短時間での多数の応募を検出する', async () => {
      const mockUser: User = {
        id: mockUserId,
        twitterId: 'twitter-123',
        screenName: 'testuser',
        profileImage: null,
        isFollower: true,
        followedAt: new Date(),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      };

      // 短時間での多数の応募を模擬
      const mockEntries: Entry[] = Array.from({ length: 10 }, (_, i) => ({
        id: `entry-${i}`,
        userId: mockUserId,
        retweetId: `tweet-${i}`,
        retweetedAt: new Date(),
        isValid: true,
        createdAt: new Date(Date.now() - i * 60000), // 1分間隔
        invalidReason: null
      }));

      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        entries: mockEntries
      });

      const result = await fraudDetectionService.calculateFraudScore(mockUserId);

      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons).toContain('不自然な応募パターンを検出');
    });

    it('正常なユーザーに対して低いスコアを返す', async () => {
      const mockUser: User = {
        id: mockUserId,
        twitterId: 'twitter-123',
        screenName: 'testuser',
        profileImage: null,
        isFollower: true,
        followedAt: new Date(),
        createdAt: new Date('2020-01-01'), // 十分に古いアカウント
        updatedAt: new Date()
      };

      // 適度な間隔での応募を模擬
      const mockEntries: Entry[] = Array.from({ length: 3 }, (_, i) => ({
        id: `entry-${i}`,
        userId: mockUserId,
        retweetId: `tweet-${i}`,
        retweetedAt: new Date(),
        isValid: true,
        createdAt: new Date(Date.now() - i * 86400000), // 1日間隔
        invalidReason: null
      }));

      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        entries: mockEntries
      });

      const result = await fraudDetectionService.calculateFraudScore(mockUserId);

      expect(result.score).toBe(0);
      expect(result.reasons).toHaveLength(0);
    });
  });

  describe('invalidateEntry', () => {
    it('高い不正スコアのエントリーを無効化する', async () => {
      const mockEntryId = 'entry-123';
      const highFraudScore = 75;

      await fraudDetectionService.invalidateEntry(mockEntryId, highFraudScore);

      expect(mockPrisma.entry.update).toHaveBeenCalledWith({
        where: { id: mockEntryId },
        data: {
          isValid: false,
          invalidReason: expect.stringContaining('不正スコア: 75')
        }
      });
    });

    it('低い不正スコアのエントリーを無効化しない', async () => {
      const mockEntryId = 'entry-123';
      const lowFraudScore = 30;

      await fraudDetectionService.invalidateEntry(mockEntryId, lowFraudScore);

      expect(mockPrisma.entry.update).not.toHaveBeenCalled();
    });
  });
});
