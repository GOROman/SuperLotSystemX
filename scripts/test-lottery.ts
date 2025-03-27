import { LotteryService } from '../src/services/lottery';

async function main() {
  const lotteryService = new LotteryService();

  try {
    console.log('抽選を開始します...');
    const winners = await lotteryService.drawWinners(3);
    console.log('当選者が選出されました:', winners);

    console.log('\n当選者の詳細情報を取得します...');
    const winnerDetails = await lotteryService.getWinners();
    console.log(JSON.stringify(winnerDetails, null, 2));
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
