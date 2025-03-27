import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import { PrismaClient, Participant } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

// 環境変数の型定義
interface Config {
  twitterApiKey: string;
  twitterApiSecret: string;
  twitterAccessToken: string;
  twitterAccessTokenSecret: string;
  twitterBearerToken: string;
  targetTweets: string[];
  winnerCount: number;
  giftAmount: number;
}

// 環境変数の取得と検証
const config: Config = {
  twitterApiKey: process.env.TWITTER_API_KEY || '',
  twitterApiSecret: process.env.TWITTER_API_SECRET || '',
  twitterAccessToken: process.env.TWITTER_ACCESS_TOKEN || '',
  twitterAccessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
  twitterBearerToken: process.env.TWITTER_BEARER_TOKEN || '',
  targetTweets: process.env.TARGET_TWEETS?.split(',') || [],
  winnerCount: Number(process.env.WINNER_COUNT) || 10,
  giftAmount: Number(process.env.GIFT_AMOUNT) || 15,
};

// 設定の検証
Object.entries(config).forEach(([key, value]) => {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    console.error(`環境変数 ${key} が設定されていません。`);
    process.exit(1);
  }
});

// Twitter APIクライアントの初期化
const twitterClient = new TwitterApi({
  appKey: config.twitterApiKey,
  appSecret: config.twitterApiSecret,
  accessToken: config.twitterAccessToken,
  accessSecret: config.twitterAccessTokenSecret,
});

// フォロワーチェック
async function isFollower(userId: string): Promise<boolean> {
  try {
    const response = await twitterClient.v2.user(userId);
    if (!response.data) return false;

    const followingResponse = await twitterClient.v2.following(response.data.id);
    return followingResponse.data.some(user => user.id === userId);
  } catch (error) {
    console.error(`フォロワーチェックエラー (${userId}):`, error);
    return false;
  }
}

// リツイートチェック
async function hasRetweeted(userId: string, tweetId: string): Promise<boolean> {
  try {
    const retweets = await twitterClient.v2.tweetRetweetedBy(tweetId, {
      'user.fields': ['id']
    });
    return retweets.data.some((user: { id: string }) => user.id === userId);
  } catch (error) {
    console.error(`リツイートチェックエラー (${userId}, ${tweetId}):`, error);
    return false;
  }
}

// 応募者の資格確認
async function isEligible(userId: string): Promise<boolean> {
  const isFollowing = await isFollower(userId);
  if (!isFollowing) return false;

  for (const tweetId of config.targetTweets) {
    const hasRt = await hasRetweeted(userId, tweetId);
    if (!hasRt) return false;
  }

  return true;
}

// 当選者へのDM送信
async function sendWinnerDM(userId: string, giftCode: string): Promise<boolean> {
  try {
    const message = `🎉おめでとうございます！\nGOROmanフォロワー5万人突破記念キャンペーンに当選しました！\n\nAmazonギフト券（${config.giftAmount}円分）: ${giftCode}\n\nご参加ありがとうございました！`;
    
    await twitterClient.v2.sendDmToParticipant({
      participantId: userId,
      text: message
    });
    
    return true;
  } catch (error) {
    console.error(`DM送信エラー (${userId}):`, error);
    return false;
  }
}

// 抽選処理
async function selectWinners(participants: Participant[]): Promise<Participant[]> {
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, config.winnerCount);
}

// メイン処理
async function main(): Promise<void> {
  try {
    // キャンペーン設定の取得
    const campaign = await prisma.campaign.findFirst({
      where: { isActive: true }
    });

    if (!campaign) {
      throw new Error('アクティブなキャンペーンが見つかりません。');
    }

    // 応募者データの取得
    const participants = await prisma.participant.findMany({
      where: {
        isEligible: true,
        isWinner: false
      }
    });

    if (participants.length === 0) {
      console.log('対象となる応募者が見つかりません。');
      return;
    }

    // 当選者の選出
    const winners = await selectWinners(participants);
    
    // 当選者の処理
    for (const winner of winners) {
      // ギフトコードの生成（実際にはAmazonギフト券APIなどを使用）
      const giftCode = `DEMO-${Math.random().toString(36).substring(2, 15)}`;
      
      // DMの送信
      const dmSent = await sendWinnerDM(winner.userId, giftCode);
      
      if (dmSent) {
        // データベースの更新
        await prisma.participant.update({
          where: { id: winner.id },
          data: {
            isWinner: true,
            giftCode: giftCode,
            notifiedAt: new Date()
          }
        });
      }
    }
    
    console.log(`抽選完了: ${winners.length}名の当選者に通知を送信しました。`);
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトの実行
main().catch(console.error);
