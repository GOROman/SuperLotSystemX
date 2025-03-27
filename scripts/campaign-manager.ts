import dotenv from 'dotenv';
import { User, Entry } from '@prisma/client';
import prisma from '../prisma/client';

dotenv.config();

// 環境変数の型定義
interface Config {
  winnerCount: number;
  giftAmount: number;
}

// 環境変数の取得と検証
const config: Config = {
  winnerCount: Number(process.env.WINNER_COUNT) || 10,
  giftAmount: Number(process.env.GIFT_AMOUNT) || 15,
};

// 設定の検証
Object.entries(config).forEach(([key, value]) => {
  if (!value) {
    console.error(`環境変数 ${key} が設定されていません。`);
    process.exit(1);
  }
});

// DM送信用のメッセージを生成
function generateDMMessage(giftCode: string): string {
  return `\n🎉おめでとうございます！\nGOROmanフォロワー5万人突破記念キャンペーンに当選しました！\n\nAmazonギフト券（${config.giftAmount}円分）\n\nご参加ありがとうございました！`;
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
async function selectWinners(entries: (Entry & { user: User })[], seed?: number): Promise<(Entry & { user: User })[]> {
  // シード値が指定されていない場合は現在のタイムスタンプを使用
  const currentSeed = seed ?? Date.now();
  const random = new SeededRandom(currentSeed);
  
  // Fisher-Yatesシャッフルアルゴリズムの実装
  const shuffled = [...entries];
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
    // 有効な応募者データの取得
    const entries = await prisma.entry.findMany({
      where: {
        isValid: true,
      },
      include: {
        user: true
      }
    });

    if (entries.length === 0) {
      console.log('対象となる応募者が見つかりません。');
      return;
    }

    // 環境変数からシード値を取得して当選者を選出
    const SEED = Number(process.env.SEED_VALUE) || 565656;
    const winners = await selectWinners(entries, SEED);
    
    // 当選者情報の生成
    const winnersList = winners.map(entry => {
      // ギフトコードの生成（実際にはAmazonギフト券APIなどを使用）
      const giftCode = `DEMO-${Math.random().toString(36).substring(2, 15)}`;
      const dmMessage = generateDMMessage(giftCode);
      
      return {
        userId: entry.userId,
        screenName: entry.user.screenName,
        giftCode,
        dmMessage
      };
    });
    
    // 2秒待機する関数
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 当選者リストの出力
    console.log('\n=== 当選者リスト ===');

    for (const [index, winner] of winnersList.entries()) {
      console.log(`[当選者 ${index + 1}]`);
      await sleep(2000); // 2秒待機
      console.log(`Xフォロワー名: @${winner.screenName}`);
      await sleep(2000); // 2秒待機
      console.log('\nDMメッセージ:');
      console.log(winner.dmMessage);
      console.log('----------------------------------------------------------------------');
    }
    
    console.log(`\n抽選完了: ${winners.length}名の当選者を選出しました。`);
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトの実行
main().catch(console.error);
