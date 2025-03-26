import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

interface SystemStatus {
  database: 'healthy' | 'unhealthy';
  api: 'healthy' | 'unhealthy';
  timestamp: string;
}

interface EntryStatistics {
  total: number;
  today: number;
  timestamp: string;
}

interface ErrorLog {
  logs: Array<{
    message: string;
    timestamp: string;
    level: string;
  }>;
  timestamp: string;
}

export function MonitoringDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [stats, setStats] = useState<EntryStatistics | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLog | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, statsRes, logsRes] = await Promise.all([
          fetch('/api/monitoring/status'),
          fetch('/api/monitoring/statistics'),
          fetch('/api/monitoring/errors'),
        ]);

        const [statusData, statsData, logsData] = await Promise.all([
          statusRes.json(),
          statsRes.json(),
          logsRes.json(),
        ]);

        setStatus(statusData);
        setStats(statsData);
        setErrorLogs(logsData);
      } catch (error) {
        toast({
          title: 'エラー',
          description: 'データの取得に失敗しました',
          variant: 'destructive',
        });
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30秒ごとに更新

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">システムモニタリング</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>システムステータス</CardHeader>
          <CardContent>
            {status && (
              <>
                <Alert variant={status.database === 'healthy' ? 'default' : 'destructive'}>
                  <AlertTitle>データベース</AlertTitle>
                  <AlertDescription>{status.database}</AlertDescription>
                </Alert>
                <Alert variant={status.api === 'healthy' ? 'default' : 'destructive'} className="mt-2">
                  <AlertTitle>API</AlertTitle>
                  <AlertDescription>{status.api}</AlertDescription>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>応募統計</CardHeader>
          <CardContent>
            {stats && (
              <div className="space-y-2">
                <p>総応募数: {stats.total}</p>
                <p>本日の応募: {stats.today}</p>
                <p className="text-sm text-gray-500">
                  最終更新: {new Date(stats.timestamp).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>エラーログ</CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">全て</TabsTrigger>
                <TabsTrigger value="error">エラー</TabsTrigger>
                <TabsTrigger value="warning">警告</TabsTrigger>
              </TabsList>
              {errorLogs?.logs.map((log, index) => (
                <div key={index} className="mt-2 p-2 bg-gray-50 rounded">
                  <p className="font-medium">{log.message}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()} - {log.level}
                  </p>
                </div>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
