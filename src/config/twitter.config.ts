export interface TwitterConfig {
  targetTweetIds: string[];
  scanIntervalMinutes: number;
}

export const twitterConfig: TwitterConfig = {
  // 監視対象のツイートID
  targetTweetIds: [
    // Example: '1234567890123456789'
  ],
  // スキャン間隔（分）
  scanIntervalMinutes: 5,
};
