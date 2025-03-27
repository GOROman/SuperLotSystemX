-- テストユーザーの作成
INSERT INTO User (id, twitterId, screenName, isFollower, createdAt, updatedAt)
VALUES
  ('user_001', '1234567890', 'user1', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('user_002', '2345678901', 'user2', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('user_003', '3456789012', 'user3', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('user_004', '4567890123', 'user4', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('user_005', '5678901234', 'user5', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('user_elon', '44196397', 'elonmusk', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- エントリー（リツイート）の作成
INSERT INTO Entry (id, userId, retweetId, retweetedAt, createdAt, isValid)
VALUES
  ('entry_001', 'user_001', 'rt_001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
  ('entry_002', 'user_002', 'rt_002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
  ('entry_003', 'user_003', 'rt_003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
  ('entry_004', 'user_004', 'rt_004', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
  ('entry_005', 'user_005', 'rt_005', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
  ('entry_elon', 'user_elon', 'rt_elon', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true);

-- ギフトコードの作成
INSERT INTO GiftCode (id, code, amount, isUsed, createdAt)
VALUES
  ('code_001', 'GIFT001', 1000, false, CURRENT_TIMESTAMP),
  ('code_002', 'GIFT002', 1000, false, CURRENT_TIMESTAMP),
  ('code_003', 'GIFT003', 1000, false, CURRENT_TIMESTAMP),
  ('code_004', 'GIFT004', 1000, false, CURRENT_TIMESTAMP),
  ('code_005', 'GIFT005', 1000, false, CURRENT_TIMESTAMP);
