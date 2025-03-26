import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export class MonitoringService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getSystemStatus() {
    try {
      const dbStatus = await this.checkDatabaseStatus();
      const apiStatus = await this.checkAPIStatus();
      return {
        database: dbStatus,
        api: apiStatus,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('システムステータスの取得に失敗しました', { error });
      throw error;
    }
  }

  async getEntryStatistics() {
    try {
      const totalEntries = await this.prisma.entry.count();
      const todayEntries = await this.prisma.entry.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });

      return {
        total: totalEntries,
        today: todayEntries,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('応募統計の取得に失敗しました', { error });
      throw error;
    }
  }

  async getErrorLogs(limit = 100) {
    try {
      // Note: 実際のエラーログの取得方法はログ管理システムに依存
      return {
        logs: [],
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('エラーログの取得に失敗しました', { error });
      throw error;
    }
  }

  private async checkDatabaseStatus() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'healthy';
    } catch (error) {
      return 'unhealthy';
    }
  }

  private async checkAPIStatus() {
    try {
      // Note: 実際のAPI健全性チェックはシステム要件に応じて実装
      return 'healthy';
    } catch (error) {
      return 'unhealthy';
    }
  }
}
