-- キャンペーンデータの作成
INSERT INTO Campaign (
  id,
  name,
  description,
  startDate,
  endDate,
  winnerCount,
  giftAmount,
  isActive,
  createdAt,
  updatedAt
) VALUES (
  'camp_001',
  'GOROmanフォロワー5万人突破記念キャンペーン',
  'フォロー＆リツイートで総額15万円分のAmazonギフト券が当たる！',
  '2025-03-27 00:00:00',
  '2025-04-03 23:59:59',
  10,
  15000,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
