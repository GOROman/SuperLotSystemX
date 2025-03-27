import { TwitterApi } from 'twitter-api-v2';
import { PrismaClient, User } from '@prisma/client';
import { Logger } from '../utils/logger';

export class TwitterService {
  private twitter: TwitterApi;
  private prisma: PrismaClient;
  private logger: Logger;

  constructor(
    twitter: TwitterApi,
    prisma: PrismaClient,
    logger: Logger
  ) {
    this.twitter = twitter;
    this.prisma = prisma;
    this.logger = logger;
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      return user;
    } catch (error) {
      this.logger.error('Failed to get user:', error);
      return null;
    }
  }

  async getUserByScreenName(screenName: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { screenName }
      });
      return user;
    } catch (error) {
      this.logger.error('Failed to get user by screen name:', error);
      return null;
    }
  }

  async verifyCredentials(): Promise<boolean> {
    try {
      const response = await this.twitter.v2.me();
      return !!response.data;
    } catch (error) {
      this.logger.error('Failed to verify credentials:', error);
      return false;
    }
  }

  async followUser(targetUserId: string): Promise<boolean> {
    try {
      const response = await this.twitter.v2.follow(targetUserId);
      return response.data.following;
    } catch (error) {
      this.logger.error('Failed to follow user:', error);
      return false;
    }
  }

  async unfollowUser(targetUserId: string): Promise<boolean> {
    try {
      const response = await this.twitter.v2.unfollow(targetUserId);
      return !response.data.following;
    } catch (error) {
      this.logger.error('Failed to unfollow user:', error);
      return false;
    }
  }

  async getFollowers(userId: string, maxResults = 100): Promise<string[]> {
    try {
      const followers = await this.twitter.v2.followers(userId, {
        max_results: maxResults
      });
      return followers.data.map(follower => follower.id);
    } catch (error) {
      this.logger.error('Failed to get followers:', error);
      return [];
    }
  }

  async getFollowing(userId: string, maxResults = 100): Promise<string[]> {
    try {
      const following = await this.twitter.v2.following(userId, {
        max_results: maxResults
      });
      return following.data.map(user => user.id);
    } catch (error) {
      this.logger.error('Failed to get following:', error);
      return [];
    }
  }
}
