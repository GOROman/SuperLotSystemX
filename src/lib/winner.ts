import { prisma } from '@/prisma/client'

export async function getWinnerByToken(token: string) {
  const winner = await prisma.winner.findUnique({
    where: { token },
    include: {
      user: true,
      giftCode: true,
      notification: true,
    },
  })

  if (!winner) {
    return null
  }

  // 閲覧回数を更新
  if (winner.notification) {
    await prisma.winnerNotification.update({
      where: { id: winner.notification.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    })
  }

  return winner
}

export async function confirmWinner(token: string) {
  const winner = await prisma.winner.findUnique({
    where: { token },
    include: {
      notification: true,
    },
  })

  if (!winner) {
    return null
  }

  // 既に確認済みの場合
  if (winner.confirmedAt) {
    return winner
  }

  // 期限切れの場合
  if (winner.notification && winner.notification.expiresAt < new Date()) {
    await prisma.winnerNotification.update({
      where: { id: winner.notification.id },
      data: { status: 'EXPIRED' },
    })
    return winner
  }

  // 当選確認を更新
  const updatedWinner = await prisma.winner.update({
    where: { id: winner.id },
    data: {
      confirmedAt: new Date(),
      notification: {
        update: {
          status: 'CONFIRMED',
        },
      },
    },
    include: {
      user: true,
      giftCode: true,
      notification: true,
    },
  })

  return updatedWinner
}
