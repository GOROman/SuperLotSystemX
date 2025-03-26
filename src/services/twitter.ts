import { TwitterApi } from 'twitter-api-v2';

export class TwitterService {
  private client: TwitterApi;

  constructor() {
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      throw new Error('Twitter API credentials are not properly configured');
    }

    this.client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });
  }

  /**
   * ユーザーのツイートを取得
   */
  async getUserTweets(userId: string, maxResults = 10) {
    try {
      const tweets = await this.client.v2.userTimeline(userId, {
        max_results: maxResults,
        'tweet.fields': ['created_at', 'public_metrics'],
      });
      return tweets.data;
    } catch (error) {
      console.error('Error fetching user tweets:', error);
      throw error;
    }
  }

  /**
   * キーワードでツイートを検索
   */
  async searchTweets(query: string, maxResults = 10) {
    try {
      const tweets = await this.client.v2.search(query, {
        max_results: maxResults,
        'tweet.fields': ['created_at', 'public_metrics'],
      });
      return tweets.data;
    } catch (error) {
      console.error('Error searching tweets:', error);
      throw error;
    }
  }

  /**
   * ツイートを投稿
   */
  async tweet(text: string) {
    try {
      const tweet = await this.client.v2.tweet(text);
      return tweet.data;
    } catch (error) {
      console.error('Error posting tweet:', error);
      throw error;
    }
  }
}
