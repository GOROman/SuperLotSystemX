import { PrismaClient, GiftCode } from '@prisma/client';
import { Logger } from '../utils/logger';
import * as crypto from 'crypto';

export class GiftCodeService {
  private prisma: PrismaClient;
  private logger: Logger;

  constructor(
    prisma: PrismaClient,
    logger: Logger
  ) {
    this.prisma = prisma;
    this.logger = logger;
  }

  private generateCode(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex');
  }

  private getKeyAndIv(): { key: Buffer; iv: Buffer } {
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = Buffer.alloc(16, 0);
    return { key, iv };
  }

  private encryptCode(code: string): string {
    const { key, iv } = this.getKeyAndIv();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(code, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptCode(encryptedCode: string): string {
    const { key, iv } = this.getKeyAndIv();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedCode, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async createGiftCode(amount: number, expiresAt?: Date): Promise<GiftCode> {
    try {
      const code = this.generateCode();
      const encryptedCode = this.encryptCode(code);

      const giftCode = await this.prisma.giftCode.create({
        data: {
          code,
          encryptedCode,
          amount,
          expiresAt,
          isUsed: false
        }
      });

      return giftCode;
    } catch (error: unknown) {
      this.logger.error('Failed to create gift code:', error as Record<string, unknown>);
      throw error;
    }
  }

  async useGiftCode(code: string, note?: string): Promise<GiftCode | null> {
    try {
      const giftCode = await this.prisma.giftCode.findFirst({
        where: {
          code,
          isUsed: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      if (!giftCode) {
        return null;
      }

      const updatedGiftCode = await this.prisma.giftCode.update({
        where: { id: giftCode.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
          note
        }
      });

      return updatedGiftCode;
    } catch (error: unknown) {
      this.logger.error('Failed to use gift code:', error as Record<string, unknown>);
      return null;
    }
  }

  async getGiftCode(code: string): Promise<GiftCode | null> {
    try {
      return await this.prisma.giftCode.findFirst({
        where: { code }
      });
    } catch (error: unknown) {
      this.logger.error('Failed to get gift code:', error as Record<string, unknown>);
      return null;
    }
  }

  async listUnusedGiftCodes(): Promise<GiftCode[]> {
    try {
      return await this.prisma.giftCode.findMany({
        where: {
          isUsed: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });
    } catch (error: unknown) {
      this.logger.error('Failed to list unused gift codes:', error as Record<string, unknown>);
      return [];
    }
  }
}
