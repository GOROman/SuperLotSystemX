-- ユーザーの作成
INSERT INTO User (id, twitterId, screenName, isFollower, createdAt, updatedAt)
VALUES
  ('user_X_U_R_', 'X_U_R_', 'X_U_R_', true, '2025-03-27 18:47:44', '2025-03-27 18:47:44'),
  ('user_hasegaw', 'hasegaw', 'hasegaw', true, '2025-03-27 18:47:44', '2025-03-27 18:47:44'),
  ('user_masaaki_oyama', 'masaaki_oyama', 'masaaki_oyama', true, '2025-03-27 18:47:44', '2025-03-27 18:47:44'),
  ('user_rockslope', 'rockslope', 'rockslope', true, '2025-03-27 18:47:44', '2025-03-27 18:47:44'),
  ('user_ulto5', 'ulto5', 'ulto5', true, '2025-03-27 18:47:44', '2025-03-27 18:47:44'),
  ('user_sgo2go', 'sgo2go', 'sgo2go', true, '2025-03-27 18:47:44', '2025-03-27 18:47:44'),
  ('user_omusubi_p', 'omusubi_p', 'omusubi_p', true, '2025-03-27 18:47:44', '2025-03-27 18:47:44'),
  ('user_teratani_tsuyos', 'teratani_tsuyos', 'teratani_tsuyos', true, '2025-03-27 18:47:44', '2025-03-27 18:47:44'),
  ('user_okmt2345', 'okmt2345', 'okmt2345', true, '2025-03-27 18:47:44', '2025-03-27 18:47:44'),
  ('user_ryotaro_japan', 'ryotaro_japan', 'ryotaro_japan', true, '2025-03-27 18:47:44', '2025-03-27 18:47:44');

-- エントリー（リツイート）の作成
INSERT INTO Entry (id, userId, retweetId, retweetedAt, createdAt, isValid)
VALUES
  ('rt_X_U_R_', 'user_X_U_R_', 'rt_X_U_R_', '2025-03-27 18:47:44', '2025-03-27 18:47:44', true),
  ('rt_hasegaw', 'user_hasegaw', 'rt_hasegaw', '2025-03-27 18:47:44', '2025-03-27 18:47:44', true),
  ('rt_masaaki_oyama', 'user_masaaki_oyama', 'rt_masaaki_oyama', '2025-03-27 18:47:44', '2025-03-27 18:47:44', true),
  ('rt_rockslope', 'user_rockslope', 'rt_rockslope', '2025-03-27 18:47:44', '2025-03-27 18:47:44', true),
  ('rt_ulto5', 'user_ulto5', 'rt_ulto5', '2025-03-27 18:47:44', '2025-03-27 18:47:44', true),
  ('rt_sgo2go', 'user_sgo2go', 'rt_sgo2go', '2025-03-27 18:47:44', '2025-03-27 18:47:44', true),
  ('rt_omusubi_p', 'user_omusubi_p', 'rt_omusubi_p', '2025-03-27 18:47:44', '2025-03-27 18:47:44', true),
  ('rt_teratani_tsuyos', 'user_teratani_tsuyos', 'rt_teratani_tsuyos', '2025-03-27 18:47:44', '2025-03-27 18:47:44', true),
  ('rt_okmt2345', 'user_okmt2345', 'rt_okmt2345', '2025-03-27 18:47:44', '2025-03-27 18:47:44', true),
  ('rt_ryotaro_japan', 'user_ryotaro_japan', 'rt_ryotaro_japan', '2025-03-27 18:47:44', '2025-03-27 18:47:44', true);

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
);
