import { TwitterService } from '../twitter';
import { twitterConfig } from '../../config/twitter.config';

// Mock Twitter API client
jest.mock('twitter-api-v2', () => {
  return {
    TwitterApi: jest.fn().mockImplementation(() => ({
      v2: {
        tweetRetweetedBy: jest.fn().mockResolvedValue({
          data: [
            {
              id: '123',
              username: 'testuser1',
              name: 'Test User 1',
            },
            {
              id: '456',
              username: 'testuser2',
              name: 'Test User 2',
            },
          ],
        }),
      },
    })),
  };
});

// Mock config
jest.mock('../../config/twitter.config', () => ({
  twitterConfig: {
    targetTweetIds: ['tweet1', 'tweet2'],
    scanIntervalMinutes: 5,
  },
}));

describe('TwitterService', () => {
  let twitterService: TwitterService;

  beforeEach(() => {
    // Mock environment variables
    process.env.TWITTER_BEARER_TOKEN = 'test-bearer-token';
    twitterService = new TwitterService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if Twitter API bearer token is not configured', () => {
    delete process.env.TWITTER_BEARER_TOKEN;
    expect(() => new TwitterService()).toThrow(
      'Twitter API bearer token is not configured'
    );
  });

  describe('getRepostUsers', () => {
    it('should fetch repost users successfully', async () => {
      const users = await twitterService.getRepostUsers('tweet1');
      expect(users).toHaveLength(2);
      expect(users[0]).toEqual({
        id: '123',
        username: 'testuser1',
        name: 'Test User 1',
        repostedAt: expect.any(Date),
      });
    });
  });

  describe('getAllConfiguredTweetRepostUsers', () => {
    it('should fetch repost users for all configured tweets', async () => {
      const results = await twitterService.getAllConfiguredTweetRepostUsers();
      expect(results.size).toBe(2);
      expect(results.get('tweet1')).toHaveLength(2);
      expect(results.get('tweet2')).toHaveLength(2);
    });
  });
});
