-- テスト用参加者データの作成
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
('part_001', 'test_user1', 'TestUser1', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_002', 'test_user2', 'TestUser2', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_003', 'test_user3', 'TestUser3', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_004', 'test_user4', 'TestUser4', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_005', 'test_user5', 'TestUser5', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_006', 'test_user6', 'TestUser6', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_007', 'test_user7', 'TestUser7', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_008', 'test_user8', 'TestUser8', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_009', 'test_user9', 'TestUser9', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part_010', 'test_user10', 'TestUser10', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
