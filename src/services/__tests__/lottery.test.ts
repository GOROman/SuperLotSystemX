import { PrismaClient } from '@prisma/client';
import { LotteryService } from '../lottery';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Prismaクライアントのモック
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockDeep<PrismaClient>()),
}));

describe('LotteryService', () => {
  let lotteryService: LotteryService;
  let prisma: any;

  beforeEach(() => {
    mockReset(prisma);
    lotteryService = new LotteryService();
    prisma = (lotteryService as any).prisma;
  });

  describe('drawWinners', () => {
    it('should select winners from valid entries', async () => {
      // モックデータの設定
      const mockEntries = [
        {
          userId: 'user1',
          isValid: true,
          user: { id: 'user1', isFollower: true },
        },
        {
          userId: 'user2',
          isValid: true,
          user: { id: 'user2', isFollower: true },
        },
        {
          userId: 'user3',
          isValid: true,
          user: { id: 'user3', isFollower: true },
        },
      ];

      const mockGiftCodes = [
        { id: 'code1' },
        { id: 'code2' },
      ];

      // Prismaのメソッドをモック
      prisma.entry.findMany.mockResolvedValue(mockEntries);
      prisma.giftCode.findMany.mockResolvedValue(mockGiftCodes);
      prisma.winner.create.mockImplementation((args: any) => ({
        userId: args.data.userId,
        giftCodeId: args.data.giftCodeId,
      }));

      // 2名の当選者を選出
      const winners = await lotteryService.drawWinners(2);

      // 検証
      expect(winners).toHaveLength(2);
      expect(prisma.winner.create).toHaveBeenCalledTimes(2);
      expect(new Set(winners).size).toBe(2); // 重複がないことを確認
    });

    it('should throw error when no valid entries found', async () => {
      prisma.entry.findMany.mockResolvedValue([]);

      await expect(lotteryService.drawWinners(1)).rejects.toThrow('No valid entries found');
    });

    it('should throw error when not enough valid entries', async () => {
      prisma.entry.findMany.mockResolvedValue([{ userId: 'user1' }]);

      await expect(lotteryService.drawWinners(2)).rejects.toThrow('Not enough valid entries');
    });

    it('should throw error when not enough gift codes', async () => {
      prisma.entry.findMany.mockResolvedValue([
        { userId: 'user1' },
        { userId: 'user2' },
      ]);
      prisma.giftCode.findMany.mockResolvedValue([{ id: 'code1' }]);

      await expect(lotteryService.drawWinners(2)).rejects.toThrow('Not enough gift codes available');
    });
  });

  describe('getWinners', () => {
    it('should return all winners with user and gift code information', async () => {
      const mockWinners = [
        {
          userId: 'user1',
          user: { id: 'user1', screenName: 'User 1' },
          giftCode: { id: 'code1', code: 'ABC123' },
        },
      ];

      prisma.winner.findMany.mockResolvedValue(mockWinners);

      const winners = await lotteryService.getWinners();

      expect(winners).toEqual(mockWinners);
      expect(prisma.winner.findMany).toHaveBeenCalledWith({
        include: {
          user: true,
          giftCode: true,
        },
      });
    });
  });

  describe('getWinner', () => {
    it('should return specific winner information', async () => {
      const mockWinner = {
        userId: 'user1',
        user: { id: 'user1', screenName: 'User 1' },
        giftCode: { id: 'code1', code: 'ABC123' },
      };

      prisma.winner.findFirst.mockResolvedValue(mockWinner);

      const winner = await lotteryService.getWinner('user1');

      expect(winner).toEqual(mockWinner);
      expect(prisma.winner.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: {
          user: true,
          giftCode: true,
        },
      });
    });
  });
});
