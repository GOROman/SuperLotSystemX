import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MonitoringService } from '@/services/monitoring-service';

export async function GET() {
  try {
    const monitoringService = new MonitoringService(prisma);
    const logs = await monitoringService.getErrorLogs();
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json(
      { error: 'エラーログの取得に失敗しました' },
      { status: 500 }
    );
  }
}
