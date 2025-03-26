import { PrismaClient, User } from '@prisma/client';
import { FollowerService } from '../follower-service';
import { Logger } from '../../utils/logger';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

// モックの作成
const mockPrisma = mockDeep<PrismaClient>();
const mockLogger = mockDeep<Logger>();

describe('FollowerService', () => {
  let followerService: FollowerService;

  beforeEach(() => {
    followerService = new FollowerService(mockPrisma as unknown as PrismaClient, mockLogger);
    jest.clearAllMocks();
  });

  describe('upsertFollower', () => {
    it('should create or update a follower', async () => {
      const mockUser: User = {
        id: '1',
        twitterId: '123',
        screenName: 'test_user',
        profileImage: 'http://example.com/image.jpg',
        isFollower: true,
        followedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const mockUser: User = {
        id: '1',
        twitterId: '123',
        screenName: 'test_user',
        profileImage: null,
        isFollower: false,
        followedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const mockFollowers: User[] = [
        {
          id: '1',
          twitterId: '123',
          screenName: 'test_user1',
          profileImage: null,
          isFollower: true,
          followedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          twitterId: '456',
          screenName: 'test_user2',
          profileImage: null,
          isFollower: true,
          followedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
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
