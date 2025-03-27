import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET;
const TARGET_TWEETS = process.env.TARGET_TWEETS?.split(',') || [];

type TweetStats = {
  tweetId: string;
  replies: number;
  retweets: number;
  likes: number;
  users: Array<{
    name: string;
    id: string;
    username: string;
    followersCount: number;
  }>;
};

/**
 * HTMLレポートを生成する関数
 */
function generateHtmlReport(results: TweetStats[]): string {
  const rows = results.map(result => {
    const userRows = result.users
      .map(user => `
        <tr>
          <td>${user.name}</td>
          <td><a href="https://twitter.com/${user.username}" target="_blank">@${user.username}</a></td>
          <td>${user.followersCount.toLocaleString()}</td>
        </tr>
      `)
      .join('');

    return `
      <div class="tweet-stats">
        <h2>ツイート ID: ${result.tweetId}</h2>
        <p>
          リプライ: ${result.replies.toLocaleString()} | 
          リツイート: ${result.retweets.toLocaleString()} | 
          いいね: ${result.likes.toLocaleString()}
        </p>
        <table>
          <thead>
            <tr>
              <th>名前</th>
              <th>ユーザー名</th>
              <th>フォロワー数</th>
            </tr>
          </thead>
          <tbody>
            ${userRows}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>リツイート情報</title>
      <style>
        body { font-family: sans-serif; margin: 2rem; }
        .tweet-stats { margin-bottom: 2rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
        a { color: #1da1f2; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>リツイート情報レポート</h1>
      ${rows}
    </body>
    </html>
  `;
}

/**
 * リツイートとフォロワー情報を取得する関数
 */
async function getRetweetsAndFollowers() {
  console.log('Twitter APIクライアントを初期化中...');
  const startTime = Date.now();
  
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
    throw new Error('Twitter API認証情報が設定されていません。');
  }

  const client = new TwitterApi({
    appKey: TWITTER_API_KEY,
    appSecret: TWITTER_API_SECRET,
    accessToken: TWITTER_ACCESS_TOKEN,
    accessSecret: TWITTER_ACCESS_TOKEN_SECRET,
  });

  const results: TweetStats[] = [];

  try {
    for (const tweetId of TARGET_TWEETS) {
      console.log(`ツイート ${tweetId} の情報を取得中...`);
      
      // ツイートの情報を取得
      const tweet = await client.v2.singleTweet(tweetId, {
        'tweet.fields': ['public_metrics'],
      });

      // リツイートしたユーザーを取得
      const retweeters = await client.v2.tweetRetweetedBy(tweetId, {
        'user.fields': ['public_metrics'],
        max_results: 100,
      });

      const users = retweeters.data.map(user => ({
        name: user.name,
        id: user.id,
        username: user.username,
        followersCount: user.public_metrics?.followers_count || 0,
      }));

      results.push({
        tweetId,
        replies: tweet.data.public_metrics?.reply_count || 0,
        retweets: tweet.data.public_metrics?.retweet_count || 0,
        likes: tweet.data.public_metrics?.like_count || 0,
        users,
      });

      console.log(`ツイート ${tweetId} の情報取得完了`);
      
      // API制限に引っかからないよう、少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 結果をファイルに保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, 'debug_output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const outputPath = path.join(outputDir, `retweets_${TARGET_TWEETS[0]}_${timestamp}.html`);
    const htmlContent = generateHtmlReport(results);
    fs.writeFileSync(outputPath, htmlContent, 'utf-8');

    console.log(`処理が完了しました。結果は ${outputPath} に保存されました。`);
    console.log(`処理時間: ${(Date.now() - startTime) / 1000} 秒`);
  } catch (error) {
    console.error('エラーが発生しました:', error);
    throw error;
  }
}

// 環境変数のチェック
if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET || !TARGET_TWEETS.length) {
  console.error('環境変数 TWITTER_API_KEY、TWITTER_API_SECRET、TWITTER_ACCESS_TOKEN、TWITTER_ACCESS_TOKEN_SECRET、TARGET_TWEETS を設定してください。');
  process.exit(1);
}

// メイン処理の実行
getRetweetsAndFollowers();
        });
        
        console.log(`ツイート ${tweetId} の処理が完了しました（処理時間: ${tweetProcessTime.toFixed(2)}秒）`);
        console.log(`取得したユーザー数: ${users.length}`);

      } catch (error) {
        console.error(`ツイート ${tweetId} の処理中にエラーが発生しました:`);
        console.error('エラーの詳細:', error instanceof Error ? error.message : String(error));
        console.error('エラーの発生場所:', error instanceof Error ? error.stack : '不明');
      }
    }

    // 結果を表示
    for (const result of results) {
      console.log(`\nツイート ID: ${result.tweetId}`);
      console.log('統計情報:');
      console.log(`リプライ数: ${result.replies}`);
      console.log(`リツイート数: ${result.retweets}`);
      console.log(`いいね数: ${result.likes}`);
      
      console.log('リツイートユーザー一覧:');
      result.users.forEach((user) => {
        console.log(`${user.name} (${user.id})`);
      });
    }

  } catch (error) {
    console.error('致命的なエラーが発生しました:');
    console.error('エラーの詳細:', error instanceof Error ? error.message : String(error));
    console.error('エラーの発生場所:', error instanceof Error ? error.stack : '不明');
  } finally {
    console.log('ブラウザを終了中...');
    await browser.close();
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    console.log(`\n処理が完了しました（総処理時間: ${totalTime.toFixed(2)}秒）`);
  }
}

// 環境変数のチェック
if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET || !TARGET_TWEETS.length) {
  console.error('環境変数 TWITTER_API_KEY、TWITTER_API_SECRET、TWITTER_ACCESS_TOKEN、TWITTER_ACCESS_TOKEN_SECRET、TARGET_TWEETS を設定してください。');
  process.exit(1);
}

getRetweetsAndFollowers();
