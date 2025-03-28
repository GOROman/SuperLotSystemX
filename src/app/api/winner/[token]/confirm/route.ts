import { NextResponse } from 'next/server'
import { confirmWinner } from '@/lib/winner'

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const winner = await confirmWinner(params.token)

    if (!winner) {
      return new NextResponse('Not Found', { status: 404 })
    }

    // 当選確認ページにリダイレクト
    return NextResponse.redirect(new URL(`/winner/${params.token}`, request.url))
  } catch (error) {
    console.error('Error confirming winner:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
