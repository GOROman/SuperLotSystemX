import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export const metadata: Metadata = {
  title: '当選確認 | SuperLotSystemX',
  description: '当選確認ページです。当選確認トークンを入力して当選情報を確認できます。',
}

export default function WinnerPage() {
  const [token, setToken] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (token) {
      router.push(`/winner/${token}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>当選確認</CardTitle>
          <CardDescription>
            当選確認トークンを入力して、当選情報を確認してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="当選確認トークンを入力"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              確認する
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
