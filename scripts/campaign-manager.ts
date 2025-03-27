import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import { Participant } from '@prisma/client';
import prisma from '../prisma/client';

dotenv.config();

// 環境変数の型定義
interface Config {
  twitterApiKey: string;
  twitterApiSecret: string;
  twitterAccessToken: string;
  twitterAccessTokenSecret: string;
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

// DM送信用のメッセージを生成
function generateDMMessage(giftCode: string): string {
  return `🎉おめでとうございます！\nGOROmanフォロワー5万人突破記念キャンペーンに当選しました！\n\nAmazonギフト券（${config.giftAmount}円分）: ${giftCode}\n\nご参加ありがとうございました！`;
}

// シード値に基づく乱数生成器クラス
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // xorshiftアルゴリズムによる乱数生成
  private next(): number {
    this.seed ^= this.seed << 13;
    this.seed ^= this.seed >> 17;
    this.seed ^= this.seed << 5;
    return (this.seed >>> 0) / 4294967296;
  }

  // 指定範囲の整数を生成
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// 抽選処理
async function selectWinners(participants: Participant[], seed?: number): Promise<Participant[]> {
  // シード値が指定されていない場合は現在のタイムスタンプを使用
  const currentSeed = seed ?? Date.now();
  const random = new SeededRandom(currentSeed);
  
  // Fisher-Yatesシャッフルアルゴリズムの実装
  const shuffled = [...participants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = random.nextInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  console.log(`抽選に使用したシード値: ${currentSeed}`);
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

    // 環境変数からシード値を取得して当選者を選出
    const SEED = Number(process.env.SEED_VALUE) || 565656;
    const winners = await selectWinners(participants, SEED);
    
    // 当選者情報の生成
    const winnersList = winners.map(winner => {
      // ギフトコードの生成（実際にはAmazonギフト券APIなどを使用）
      const giftCode = `DEMO-${Math.random().toString(36).substring(2, 15)}`;
      const dmMessage = generateDMMessage(giftCode);
      
      return {
        userId: winner.userId,
        screenName: winner.screenName,
        giftCode,
        dmMessage
      };
    });
    
    // 当選者リストの出力
    console.log('\n=== 当選者リスト ===');
    winnersList.forEach((winner, index) => {
      console.log(`\n[当選者 ${index + 1}]`);
      console.log(`ユーザーID: ${winner.userId}`);
      console.log(`スクリーンネーム: ${winner.screenName}`);
      console.log(`ギフトコード: ${winner.giftCode}`);
      console.log('\nDMメッセージ:');
      console.log(winner.dmMessage);
      console.log('---');
    });
    
    console.log(`\n抽選完了: ${winners.length}名の当選者を選出しました。`);
    console.log('当選者へのDM送信は手動で行ってください。');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトの実行
main().catch(console.error);
