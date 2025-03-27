import { PrismaClient } from '@prisma/client';

// シングルトンとしてPrismaClientを作成
const prisma = new PrismaClient();

export default prisma;
