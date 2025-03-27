import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

const TWITTER_EMAIL = process.env.TWITTER_EMAIL;
const TWITTER_PASSWORD = process.env.TWITTER_PASSWORD;
const TARGET_TWEETS = process.env.TARGET_TWEETS?.split(',') || [];

type TweetStats = {
  tweetId: string;
  replies: string;
  retweets: string;
  likes: string;
  users: Array<{
    name: string;
    id: string;
  }>;
};

async function getRetweetsAndFollowers() {
  console.log('ブラウザを起動中...');
  const startTime = Date.now();
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const results: TweetStats[] = [];
  console.log('ブラウザの起動完了');

  try {
    console.log('Twitterログインページにアクセス中...');
    await page.goto('https://twitter.com/i/flow/login');
    console.log('ログインページの読み込み完了');
    
    // メールアドレスを入力
    console.log('メールアドレス入力フィールドを待機中...');
    await page.waitForSelector('input[autocomplete="username"]', { timeout: 60000 });
    await page.type('input[autocomplete="username"]', TWITTER_EMAIL!);
    console.log('メールアドレスの入力完了');
    await page.waitForTimeout(1000);
    
    // 次へボタンをクリック
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // ユーザー名入力画面が表示された場合の処理
    try {
      const userNameInput = await page.$('input[data-testid="ocfEnterTextTextInput"]');
      if (userNameInput) {
        await userNameInput.type(TWITTER_EMAIL!);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log('ユーザー名入力画面は表示されませんでした');
    }

    // パスワードを入力
    await page.waitForSelector('input[type="password"]', { timeout: 60000 });
    await page.type('input[type="password"]', TWITTER_PASSWORD!);
    await page.waitForTimeout(1000);
    
    // ログインボタンをクリック
    await page.keyboard.press('Enter');
    
    // ログイン完了を待つ
    await page.waitForTimeout(10000);

    for (const tweetId of TARGET_TWEETS) {
      try {
        const tweetStartTime = Date.now();
        console.log(`\n処理中のツイート: ${tweetId}`);
        
        // 元のツイートページに移動
        console.log(`ツイートページにアクセス中... (${tweetId})`);
        await page.goto(`https://twitter.com/GOROman/status/${tweetId}`);
        await page.waitForTimeout(5000); // ページの読み込みを待つ
        
        // ページのHTMLを出力して構造を確認
        console.log('\n=== ツイートページのHTML ===');
        console.log(await page.content());
        console.log('=== END ツイートページのHTML ===\n');

        // インタラクション情報を取得
        console.log('インタラクション情報を取得中...');
        try {
          const stats = await page.$$eval('article[data-testid="tweet"] div[role="group"] span', (elements) => {
            return elements.map(el => el.textContent?.trim()).filter(Boolean);
          });
          console.log('取得したインタラクション情報:', stats);
        } catch (error) {
          console.log('インタラクション情報の取得に失敗:', error);
        }

        // リツイートページに移動
        console.log('リツイートページに移動中...');
        await page.goto(`https://twitter.com/i/timeline/retweets?include_available_features=1&include_entities=1&id=${tweetId}`);

        // UserCell要素が表示されるまで待機
        console.log('UserCell要素の読み込みを待機中...');
        try {
          await page.waitForSelector('div[data-testid="UserCell"]', { timeout: 10000 });
          console.log('UserCell要素の読み込みが完了');
        } catch (error) {
          console.log('警告: UserCell要素が見つかりませんでした');
        }

        // ページのHTMLをファイルに保存
        const html = await page.content();
        const fs = require('fs');
        const path = require('path');
        const outputDir = path.join(__dirname, 'debug_output');
        
        // 出力ディレクトリがなければ作成
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const htmlFilePath = path.join(outputDir, `retweets_${tweetId}_${timestamp}.html`);
        fs.writeFileSync(htmlFilePath, html);
        console.log(`HTMLを保存しました: ${htmlFilePath}`);

        // ページのHTMLを出力して構造を確認
        console.log('\n=== リツイートページのHTML ===');
        console.log(html);
        console.log('=== END リツイートページのHTML ===\n');

        // 利用可能なdata-testid属性を探す
        console.log('\n=== 利用可能なdata-testid属性を探索 ===');
        const dataTestIds = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('[data-testid]'));
          return elements.map(el => el.getAttribute('data-testid')).filter(Boolean);
        });
        console.log('見つかったdata-testid属性:', dataTestIds);
        console.log('=== END data-testid属性探索 ===\n');
        
        // リツイートユーザーの要素を取得して詳細を出力
        const tweetElements = await page.$$('article[data-testid="tweet"]');
        console.log(`\n=== Found ${tweetElements.length} tweet elements ===`);

        // ユーザー情報を取得する前に要素の存在を確認
        const userCellsCount = await page.$$eval('div[data-testid="UserCell"]', els => els.length);
        console.log(`\n見つかったUserCell要素数: ${userCellsCount}`);

        const users = await page.evaluate(() => {
          const debug = (msg: string, ...args: any[]) => {
            console.log(`[DEBUG] ${msg}`, ...args);
          };

          debug('ユーザー情報の取得を開始');

          const userElements = Array.from(document.querySelectorAll('div[data-testid="UserCell"]'));
          debug(`見つかったUserCell要素数: ${userElements.length}`);

          return userElements.map((el, index) => {
            debug(`ユーザー ${index + 1} の処理を開始`);
            debug('要素のHTML:', el.outerHTML);

            // ユーザーアバターのコンテナからユーザーIDを取得
            const avatarContainer = el.querySelector('div[data-testid^="UserAvatar-Container-"]');
            const userId = avatarContainer?.getAttribute('data-testid')?.replace('UserAvatar-Container-', '');
            debug('ユーザーID:', userId);

            // ユーザー名を取得
            const userNameEl = el.querySelector('div[data-testid="User-Name"] span');
            const name = userNameEl?.textContent?.trim();
            debug('ユーザー名:', name);
            debug('ユーザー名要素:', userNameEl ? userNameEl.outerHTML : 'null');

            if (name && userId) {
              debug(`ユーザー ${index + 1} の情報を取得成功:`, { name, id: '@' + userId });
              return { name, id: '@' + userId };
            }

            debug(`ユーザー ${index + 1} の情報取得に失敗`);
            return null;
          }).filter((user): user is { name: string; id: string } => user !== null);
        });

        console.log(`\n取得したユーザー数: ${users.length}`);
        if (users.length === 0) {
          console.log('警告: ユーザー情報を取得できませんでした');
        }

        const tweetEndTime = Date.now();
        const tweetProcessTime = (tweetEndTime - tweetStartTime) / 1000;
        
        let tweetStats = {
          replies: '0',
          retweets: '0',
          likes: '0'
        };

        try {
          const stats = await page.$$eval('article[data-testid="tweet"] div[role="group"] span', (elements) => {
            return elements.map(el => el.textContent?.trim()).filter(Boolean);
          });
          tweetStats = {
            replies: stats[0] || '0',
            retweets: stats[1] || '0',
            likes: stats[2] || '0'
          };
        } catch (error) {
          console.log('インタラクション情報の取得に失敗:', error);
        }

        results.push({
          tweetId,
          ...tweetStats,
          users
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
if (!TWITTER_EMAIL || !TWITTER_PASSWORD || !TARGET_TWEETS.length) {
  console.error('環境変数 TWITTER_EMAIL、TWITTER_PASSWORD、TARGET_TWEETS を設定してください。');
  process.exit(1);
}

getRetweetsAndFollowers();
