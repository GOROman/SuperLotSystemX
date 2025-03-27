-- 実際の参加者データの作成
INSERT INTO Participant (
  id,
  userId,
  screenName,
  isFollower,
  isEligible,
  isWinner,
  createdAt,
  updatedAt
) VALUES
('part_001', 'TaK8uMi', 'TaK8uMi', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_002', 'ysogabe', 'ysogabe', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_003', 'MAS_ag120', 'MAS_ag120', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_004', 'fB3NBMt4CwRKAF9', 'fB3NBMt4CwRKAF9', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_005', 'hnhtj_trade', 'hnhtj_trade', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_006', 'takuzirra', 'takuzirra', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_007', 'ryotaro_japan', 'ryotaro_japan', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_008', 'pero3000', 'pero3000', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_009', 'yuyuyuyuyuchi8', 'yuyuyuyuyuchi8', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_010', 'd_gogw', 'd_gogw', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
