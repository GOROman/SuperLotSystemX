import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MonitoringService } from '@/services/monitoring-service';

export async function GET() {
  try {
    const monitoringService = new MonitoringService(prisma);
    const status = await monitoringService.getSystemStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: 'システムステータスの取得に失敗しました' },
      { status: 500 }
    );
  }
}
