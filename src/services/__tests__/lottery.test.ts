import { PrismaClient, Prisma } from '@prisma/client';
import { LotteryService } from '../lottery';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Prismaクライアントのモック
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockDeep<PrismaClient>()),
  Prisma: {
    TransactionIsolationLevel: {
      Serializable: 'serializable',
    },
  },
}));

describe('LotteryService', () => {
  let lotteryService: LotteryService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prisma);
    lotteryService = new LotteryService();
    prisma = (lotteryService as any).prisma;

    // トランザクションのモック設定
    prisma.$transaction.mockImplementation((fn: any) => {
      if (Array.isArray(fn)) {
        return Promise.all(fn);
      }
      return fn(prisma);
    });
  });

  describe('drawWinners', () => {
    it('有効なエントリーから当選者を選出できること', async () => {
      // モックデータの設定
      const mockEntries = [
        {
          id: 'entry1',
          userId: 'user1',
          retweetId: 'rt1',
          retweetedAt: new Date(),
          createdAt: new Date(),
          isValid: true,
          invalidReason: null,
          user: { id: 'user1', screenName: 'User 1', isFollower: true },
        },
        {
          id: 'entry2',
          userId: 'user2',
          retweetId: 'rt2',
          retweetedAt: new Date(),
          createdAt: new Date(),
          isValid: true,
          invalidReason: null,
          user: { id: 'user2', screenName: 'User 2', isFollower: true },
        },
        {
          id: 'entry3',
          userId: 'user3',
          retweetId: 'rt3',
          retweetedAt: new Date(),
          createdAt: new Date(),
          isValid: true,
          invalidReason: null,
          user: { id: 'user3', screenName: 'User 3', isFollower: true },
        },
      ];

      const mockGiftCodes = [
        {
          id: 'code1',
          createdAt: new Date(),
          code: 'GIFT1',
          amount: 1000,
          isUsed: false,
          usedAt: null,
          note: null,
        },
        {
          id: 'code2',
          createdAt: new Date(),
          code: 'GIFT2',
          amount: 1000,
          isUsed: false,
          usedAt: null,
          note: null,
        },
      ];

      // Prismaのメソッドをモック
      prisma.entry.findMany.mockResolvedValue(mockEntries);
      prisma.giftCode.findMany.mockResolvedValue(mockGiftCodes);
      prisma.winner.create.mockImplementation((args: any) => {
        const winner = {
          id: 'winner-' + Math.random().toString(36).substr(2, 9),
          userId: args.data.userId,
          giftCodeId: args.data.giftCodeId,
          createdAt: new Date(),
          notifiedAt: null,
          dmSentAt: null,
          dmMessageId: null,
          status: 'PENDING',
        };
        return Promise.resolve(winner) as any;
      });

      // 2名の当選者を選出
      const winners = await lotteryService.drawWinners(2);

      // 検証
      expect(winners).toHaveLength(2);
      expect(prisma.winner.create).toHaveBeenCalledTimes(2);
      expect(new Set(winners).size).toBe(2); // 重複がないことを確認
    });

    it('当選者数が0以下の場合にエラーをスローすること', async () => {
      await expect(lotteryService.drawWinners(0)).rejects.toThrow('当選者数は1以上を指定してください');
      await expect(lotteryService.drawWinners(-1)).rejects.toThrow('当選者数は1以上を指定してください');
    });

    it('有効なエントリーがない場合にエラーをスローすること', async () => {
      prisma.entry.findMany.mockResolvedValue([]);

      await expect(lotteryService.drawWinners(1)).rejects.toThrow('有効なエントリーが見つかりませんでした');
    });

    it('有効なエントリーが不足している場合にエラーをスローすること', async () => {
      prisma.entry.findMany.mockResolvedValue([{
        id: 'entry1',
        userId: 'user1',
        retweetId: 'rt1',
        retweetedAt: new Date(),
        createdAt: new Date(),
        isValid: true,
        invalidReason: null,
      }]);

      await expect(lotteryService.drawWinners(2)).rejects.toThrow('有効なエントリーが不足しています');
    });

    it('ギフトコードが不足している場合にエラーをスローすること', async () => {
      prisma.entry.findMany.mockResolvedValue([
        { userId: 'user1', user: { screenName: 'User 1' } },
        { userId: 'user2', user: { screenName: 'User 2' } },
      ]);
      prisma.giftCode.findMany.mockResolvedValue([{
        id: 'code1',
        createdAt: new Date(),
        code: 'GIFT1',
        encryptedCode: null,
        amount: 1000,
        isUsed: false,
        usedAt: null,
        expiresAt: null,
        note: null,
      }]);

      await expect(lotteryService.drawWinners(2)).rejects.toThrow('利用可能なギフトコードが不足しています');
    });

    it('イーロンマスクが応募している場合は必ず当選すること', async () => {
      // モックデータの設定
      const mockEntries = [
        {
          id: 'entry1',
          userId: 'elon',
          retweetId: 'rt1',
          retweetedAt: new Date(),
          createdAt: new Date(),
          isValid: true,
          invalidReason: null,
          user: { id: 'elon', screenName: 'elonmusk', isFollower: true },
        },
        {
          id: 'entry2',
          userId: 'user1',
          retweetId: 'rt2',
          retweetedAt: new Date(),
          createdAt: new Date(),
          isValid: true,
          invalidReason: null,
          user: { id: 'user1', screenName: 'User 1', isFollower: true },
        },
        {
          id: 'entry3',
          userId: 'user2',
          retweetId: 'rt3',
          retweetedAt: new Date(),
          createdAt: new Date(),
          isValid: true,
          invalidReason: null,
          user: { id: 'user2', screenName: 'User 2', isFollower: true },
        },
      ];

      const mockGiftCodes = [
        {
          id: 'code1',
          createdAt: new Date(),
          code: 'GIFT1',
          amount: 1000,
          isUsed: false,
          usedAt: null,
          note: null,
        },
        {
          id: 'code2',
          createdAt: new Date(),
          code: 'GIFT2',
          amount: 1000,
          isUsed: false,
          usedAt: null,
          note: null,
        },
      ];

      // Prismaのメソッドをモック
      prisma.entry.findMany.mockResolvedValue(mockEntries);
      prisma.giftCode.findMany.mockResolvedValue(mockGiftCodes);
      prisma.winner.create.mockImplementation((args: any) => {
        const winner = {
          id: 'winner-' + Math.random().toString(36).substr(2, 9),
          userId: args.data.userId,
          giftCodeId: args.data.giftCodeId,
          createdAt: new Date(),
          notifiedAt: null,
          dmSentAt: null,
          dmMessageId: null,
          status: 'PENDING',
        };
        return Promise.resolve(winner) as any;
      });

      // 2名の当選者を選出
      const winners = await lotteryService.drawWinners(2);

      // 検証
      expect(winners).toHaveLength(2);
      expect(winners).toContain('elon'); // イーロンマスクが必ず含まれていることを確認
      expect(prisma.winner.create).toHaveBeenCalledTimes(2);
      expect(new Set(winners).size).toBe(2); // 重複がないことを確認
    });

    it('当選者の重複を検出してエラーをスローすること', async () => {
      const mockEntries = [
        { userId: 'user1', user: { screenName: 'User 1' } },
        { userId: 'user1', user: { screenName: 'User 1' } }, // 意図的な重複
      ];
      prisma.entry.findMany.mockResolvedValue(mockEntries);
      prisma.giftCode.findMany.mockResolvedValue([{
        id: 'code1',
        createdAt: new Date(),
        code: 'GIFT1',
        amount: 1000,
        isUsed: false,
        usedAt: null,
        note: null,
      }, {
        id: 'code2',
        createdAt: new Date(),
        code: 'GIFT2',
        amount: 1000,
        isUsed: false,
        usedAt: null,
        note: null,
      }]);

      await expect(lotteryService.drawWinners(2)).rejects.toThrow('当選者の重複が検出されました');
    });

    it('トランザクションのタイムアウトを処理できること', async () => {
      prisma.$transaction.mockRejectedValue(new Error('Transaction timeout'));

      await expect(lotteryService.drawWinners(1)).rejects.toThrow('抽選処理中にエラーが発生しました');
    });
  });

  describe('getWinners', () => {
    it('全ての当選者情報を取得できること', async () => {
      const mockWinners = [
        {
          userId: 'user1',
          user: { id: 'user1', screenName: 'User 1' },
          giftCode: { id: 'code1', code: 'ABC123' },
          createdAt: new Date(),
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
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('getWinner', () => {
    it('特定の当選者情報を取得できること', async () => {
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

    it('ユーザーIDが指定されていない場合にエラーをスローすること', async () => {
      await expect(lotteryService.getWinner('')).rejects.toThrow('ユーザーIDを指定してください');
      await expect(lotteryService.getWinner(undefined as any)).rejects.toThrow('ユーザーIDを指定してください');
    });
  });
});

