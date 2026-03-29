-- 기존 유니크 제약 삭제하고 지역 포함으로 변경
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_pblanc_unique;
ALTER TABLE announcements ADD CONSTRAINT announcements_pblanc_unique
  UNIQUE (pblanc_id, house_sn, brtc_nm, source);
