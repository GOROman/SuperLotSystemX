import { PrismaClient } from '@prisma/client';

export class Logger {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 情報ログを記録する
   * @param message メッセージ
   * @param metadata メタデータ
   */
  async info(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log('INFO', message, metadata);
  }

  /**
   * エラーログを記録する
   * @param message メッセージ
   * @param metadata メタデータ
   */
  async error(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log('ERROR', message, metadata);
  }

  /**
   * 警告ログを記録する
   * @param message メッセージ
   * @param metadata メタデータ
   */
  async warning(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log('WARNING', message, metadata);
  }

  /**
   * デバッグログを記録する
   * @param message メッセージ
   * @param metadata メタデータ
   */
  async debug(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log('DEBUG', message, metadata);
  }

  /**
   * ログを記録する
   * @param type ログタイプ
   * @param message メッセージ
   * @param metadata メタデータ
   */
  private async log(
    type: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG',
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.prisma.systemLog.create({
        data: {
          type,
          message,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (error) {
      console.error('ログの記録に失敗しました', {
        type,
        message,
        metadata,
        error,
      });
    }
  }
}
