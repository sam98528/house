-- 공고 테이블에 좌표 + 주소 + 단지명 컬럼 추가
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS complex_name text;

-- 좌표 인덱스
CREATE INDEX IF NOT EXISTS idx_announcements_coords ON announcements(lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;
