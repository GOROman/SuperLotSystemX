import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getWinnerByToken } from '@/lib/winner'

export const metadata: Metadata = {
  title: '当選情報 | SuperLotSystemX',
  description: '当選情報の確認ページです。',
}

interface PageProps {
  params: {
    token: string
  }
}

export default async function WinnerDetailPage({ params }: PageProps) {
  const winner = await getWinnerByToken(params.token)

  if (!winner) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>当選情報</CardTitle>
          <CardDescription>
            おめでとうございます！あなたは当選しました。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">当選者情報</h3>
            <p>Twitter: @{winner.user.screenName}</p>
            {winner.confirmedAt ? (
              <Alert className="bg-green-50">
                <AlertTitle>確認済み</AlertTitle>
                <AlertDescription>
                  {winner.confirmedAt.toLocaleString('ja-JP')}に確認済みです。
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-yellow-50">
                  <AlertTitle>未確認</AlertTitle>
                  <AlertDescription>
                    下のボタンをクリックして、当選を確認してください。
                  </AlertDescription>
                </Alert>
                <form action={`/api/winner/${params.token}/confirm`} method="POST">
                  <Button type="submit" className="w-full">
                    当選を確認する
                  </Button>
                </form>
              </div>
            )}
          </div>

          {winner.giftCode && winner.confirmedAt && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">ギフトコード</h3>
              <Alert>
                <AlertTitle>ギフトコード</AlertTitle>
                <AlertDescription className="font-mono">
                  {winner.giftCode.code}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
