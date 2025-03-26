import { PrismaClient } from '@prisma/client';
import { MonitoringService } from '../monitoring-service';
import { mockDeep, mockReset } from 'jest-mock-extended';

const mockPrisma = mockDeep<PrismaClient>();

describe('MonitoringService', () => {
  let monitoringService: MonitoringService;

  beforeEach(() => {
    mockReset(mockPrisma);
    monitoringService = new MonitoringService(mockPrisma);
  });

  describe('getSystemStatus', () => {
    it('正常にシステムステータスを取得できること', async () => {
      const status = await monitoringService.getSystemStatus();
      expect(status).toHaveProperty('database');
      expect(status).toHaveProperty('api');
      expect(status).toHaveProperty('timestamp');
    });
  });

  describe('getEntryStatistics', () => {
    it('正常に応募統計を取得できること', async () => {
      mockPrisma.entry.count.mockResolvedValueOnce(100);
      mockPrisma.entry.count.mockResolvedValueOnce(10);

      const stats = await monitoringService.getEntryStatistics();
      expect(stats).toHaveProperty('total', 100);
      expect(stats).toHaveProperty('today', 10);
      expect(stats).toHaveProperty('timestamp');
    });

    it('データベースエラー時に例外をスローすること', async () => {
      mockPrisma.entry.count.mockRejectedValue(new Error('DB Error'));
      await expect(monitoringService.getEntryStatistics()).rejects.toThrow();
    });
  });

  describe('getErrorLogs', () => {
    it('正常にエラーログを取得できること', async () => {
      const logs = await monitoringService.getErrorLogs();
      expect(logs).toHaveProperty('logs');
      expect(logs).toHaveProperty('timestamp');
    });
  });
});
