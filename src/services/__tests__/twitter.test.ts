import { TwitterService } from '../twitter';

// Mock Twitter API client
jest.mock('twitter-api-v2', () => {
  return {
    TwitterApi: jest.fn().mockImplementation(() => ({
      v2: {
        userTimeline: jest.fn().mockResolvedValue({
          data: [{ id: '1', text: 'Test tweet' }],
        }),
        search: jest.fn().mockResolvedValue({
          data: [{ id: '1', text: 'Test tweet' }],
        }),
        tweet: jest.fn().mockResolvedValue({
          data: { id: '1', text: 'Test tweet' },
        }),
      },
    })),
  };
});

describe('TwitterService', () => {
  let twitterService: TwitterService;

  beforeEach(() => {
    // Mock environment variables
    process.env.TWITTER_API_KEY = 'test-api-key';
    process.env.TWITTER_API_SECRET = 'test-api-secret';
    process.env.TWITTER_ACCESS_TOKEN = 'test-access-token';
    process.env.TWITTER_ACCESS_SECRET = 'test-access-secret';

    twitterService = new TwitterService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if Twitter API credentials are not configured', () => {
    delete process.env.TWITTER_API_KEY;
    expect(() => new TwitterService()).toThrow(
      'Twitter API credentials are not properly configured'
    );
  });

  describe('getUserTweets', () => {
    it('should fetch user tweets successfully', async () => {
      const tweets = await twitterService.getUserTweets('123');
      expect(tweets).toEqual([{ id: '1', text: 'Test tweet' }]);
    });
  });

  describe('searchTweets', () => {
    it('should search tweets successfully', async () => {
      const tweets = await twitterService.searchTweets('test');
      expect(tweets).toEqual([{ id: '1', text: 'Test tweet' }]);
    });
  });

  describe('tweet', () => {
    it('should post tweet successfully', async () => {
      const tweet = await twitterService.tweet('Hello, world!');
      expect(tweet).toEqual({ id: '1', text: 'Test tweet' });
    });
  });
});
