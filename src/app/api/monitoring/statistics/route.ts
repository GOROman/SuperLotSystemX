import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MonitoringService } from '@/services/monitoring-service';

export async function GET() {
  try {
    const monitoringService = new MonitoringService(prisma);
    const stats = await monitoringService.getEntryStatistics();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: '統計情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
