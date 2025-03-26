import { PrismaClient } from '@prisma/client';
import { CampaignService } from '../campaign-service';
import { TwitterService } from '../twitter';
import { FollowerService } from '../follower-service';

// モック
jest.mock('@prisma/client');
jest.mock('../twitter');
jest.mock('../follower-service');

describe('CampaignService', () => {
  let campaignService: CampaignService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockTwitter: jest.Mocked<TwitterService>;
  let mockFollowerService: jest.Mocked<FollowerService>;

  beforeEach(() => {
    jest.clearAllMocks();
    campaignService = new CampaignService();
  });

  describe('processRetweet', () => {
    const mockUserId = 'user-123';
    const mockTweetId = 'tweet-456';

    it('有効なエントリーを作成する', async () => {
      // モックの設定
      mockTwitter.getRetweetInfo.mockResolvedValue({
        created_at: '2025-03-26T12:00:00Z'
      });
      mockFollowerService.isFollower.mockResolvedValue(true);
      mockPrisma.entry.findFirst.mockResolvedValue(null);
      mockPrisma.entry.create.mockResolvedValue({
        id: 'entry-789',
        userId: mockUserId,
        retweetId: mockTweetId,
        retweetedAt: new Date('2025-03-26T12:00:00Z'),
        isValid: true,
        createdAt: new Date(),
        invalidReason: null
      });

      const result = await campaignService.processRetweet(mockTweetId, mockUserId);

      expect(result.isValid).toBe(true);
      expect(mockPrisma.entry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          retweetId: mockTweetId,
          isValid: true
        })
      });
    });

    it('フォローしていないユーザーの応募を無効にする', async () => {
      mockTwitter.getRetweetInfo.mockResolvedValue({
        created_at: '2025-03-26T12:00:00Z'
      });
      mockFollowerService.isFollower.mockResolvedValue(false);

      const result = await campaignService.processRetweet(mockTweetId, mockUserId);

      expect(result.isValid).toBe(false);
      expect(result.invalidReason).toBe('ユーザーがフォローしていません');
    });

    it('重複応募を検出する', async () => {
      mockTwitter.getRetweetInfo.mockResolvedValue({
        created_at: '2025-03-26T12:00:00Z'
      });
      mockFollowerService.isFollower.mockResolvedValue(true);
      mockPrisma.entry.findFirst.mockResolvedValue({
        id: 'existing-entry',
        userId: mockUserId,
        retweetId: 'other-tweet',
        retweetedAt: new Date(),
        isValid: true,
        createdAt: new Date(),
        invalidReason: null
      });

      const result = await campaignService.processRetweet(mockTweetId, mockUserId);

      expect(result.isValid).toBe(false);
      expect(result.invalidReason).toBe('既に応募済みです');
    });
  });

  describe('getCampaignStats', () => {
    it('正しい統計情報を返す', async () => {
      mockPrisma.entry.count.mockResolvedValueOnce(100) // 総エントリー数
        .mockResolvedValueOnce(80)  // 有効なエントリー数
        .mockResolvedValueOnce(20); // 無効なエントリー数
      
      mockPrisma.entry.groupBy.mockResolvedValue([
        { userId: 'user1', _count: 2 },
        { userId: 'user2', _count: 1 },
        { userId: 'user3', _count: 3 }
      ]);

      const stats = await campaignService.getCampaignStats();

      expect(stats).toEqual({
        totalEntries: 100,
        validEntries: 80,
        invalidEntries: 20,
        uniqueParticipants: 3
      });
    });
  });
});
