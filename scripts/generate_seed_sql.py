import csv
from datetime import datetime

def generate_sql():
    users = []
    entries = []
    
    with open('.csv/goroman_retweet_users.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            username = row['username']
            timestamp = row['timestamp']
            
            # ユーザーデータ
            user = f"  ('user_{username}', '{username}', '{username}', true, '{timestamp}', '{timestamp}')"
            users.append(user)
            
            # エントリーデータ
            entry = f"  ('rt_{username}', 'user_{username}', 'rt_{username}', '{timestamp}', '{timestamp}', true)"
            entries.append(entry)
    
    # SQL生成
    sql = """-- ユーザーの作成
INSERT INTO User (id, twitterId, screenName, isFollower, createdAt, updatedAt)
VALUES
{};\n
-- エントリー（リツイート）の作成
INSERT INTO Entry (id, userId, retweetId, retweetedAt, createdAt, isValid)
VALUES
{};\n
-- ギフトコードの作成
INSERT INTO GiftCode (id, code, amount, isUsed, createdAt)
SELECT
  'code_' || printf('%03d', rowid) as id,
  'GIFT' || printf('%03d', rowid) as code,
  1000 as amount,
  false as isUsed,
  CURRENT_TIMESTAMP as createdAt
FROM (
  WITH RECURSIVE cnt(x) AS (
    SELECT 1
    UNION ALL
    SELECT x+1 FROM cnt
    LIMIT 100
  )
  SELECT x FROM cnt
);""".format(',\n'.join(users), ',\n'.join(entries))
    
    with open('prisma/seed.sql', 'w') as f:
        f.write(sql)

if __name__ == '__main__':
    generate_sql()
