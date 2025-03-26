import { PrismaClient } from '@prisma/client';
import { FollowerService } from '../follower-service';
import { Logger } from '../../utils/logger';

// モックの作成
const mockPrisma = {
  user: {
    upsert: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
} as unknown as PrismaClient;

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

describe('FollowerService', () => {
  let followerService: FollowerService;

  beforeEach(() => {
    followerService = new FollowerService(mockPrisma, mockLogger);
    jest.clearAllMocks();
  });

  describe('upsertFollower', () => {
    it('should create or update a follower', async () => {
      const mockUser = {
        id: '1',
        twitterId: '123',
        screenName: 'test_user',
        isFollower: true,
      };

      mockPrisma.user.upsert.mockResolvedValue(mockUser);

      const result = await followerService.upsertFollower(
        '123',
        'test_user',
        'http://example.com/image.jpg',
        true
      );

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.upsert).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockPrisma.user.upsert.mockRejectedValue(error);

      await expect(
        followerService.upsertFollower('123', 'test_user')
      ).rejects.toThrow(error);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('updateFollowerStatus', () => {
    it('should update follower status', async () => {
      const mockUser = {
        id: '1',
        twitterId: '123',
        isFollower: false,
      };

      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await followerService.updateFollowerStatus('123', false);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('getFollowers', () => {
    it('should return followers list', async () => {
      const mockFollowers = [
        { id: '1', twitterId: '123', isFollower: true },
        { id: '2', twitterId: '456', isFollower: true },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockFollowers);

      const result = await followerService.getFollowers();

      expect(result).toEqual(mockFollowers);
      expect(mockPrisma.user.findMany).toHaveBeenCalled();
    });
  });

  describe('getFollowerCount', () => {
    it('should return follower count', async () => {
      mockPrisma.user.count.mockResolvedValue(10);

      const result = await followerService.getFollowerCount();

      expect(result).toBe(10);
      expect(mockPrisma.user.count).toHaveBeenCalled();
    });
  });
});
