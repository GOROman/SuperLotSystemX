import { TwitterApi } from 'twitter-api-v2';
import { twitterConfig } from '../config/twitter.config';

export interface RepostUser {
  id: string;
  username: string;
  name: string;
  repostedAt: Date;
}

export class TwitterService {
  private client: TwitterApi;

  constructor() {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;

    if (!bearerToken) {
      throw new Error('Twitter API bearer token is not configured');
    }

    this.client = new TwitterApi(bearerToken);
  }

  /**
   * 指定されたツイートのリポストユーザーを取得
   */
  async getRepostUsers(tweetId: string): Promise<RepostUser[]> {
    try {
      const retweeters = await this.client.v2.tweetRetweetedBy(tweetId, {
        'user.fields': ['username', 'name'],
      });

      return retweeters.data.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        repostedAt: new Date(), // Note: Twitter API v2では正確なリツイート時刻は取得できません
      }));
    } catch (error) {
      console.error(`Error fetching repost users for tweet ${tweetId}:`, error);
      throw error;
    }
  }

  /**
   * 設定ファイルで指定された全ツイートのリポストユーザーを取得
   */
  async getAllConfiguredTweetRepostUsers(): Promise<Map<string, RepostUser[]>> {
    const results = new Map<string, RepostUser[]>();

    for (const tweetId of twitterConfig.targetTweetIds) {
      try {
        const users = await this.getRepostUsers(tweetId);
        results.set(tweetId, users);
      } catch (error) {
        console.error(`Failed to get repost users for tweet ${tweetId}:`, error);
        results.set(tweetId, []);
      }
    }

    return results;
  }
}
