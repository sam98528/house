-- 기존 데이터 삭제 (새 API로 전환)
DELETE FROM user_bookmarks;
DELETE FROM announcements;

-- 기존 컬럼 정리 + 새 API 필드 추가
ALTER TABLE announcements
  DROP COLUMN IF EXISTS pan_id,
  DROP COLUMN IF EXISTS pan_nm,
  DROP COLUMN IF EXISTS upp_ais_tp_cd,
  DROP COLUMN IF EXISTS upp_ais_tp_nm,
  DROP COLUMN IF EXISTS ais_tp_cd,
  DROP COLUMN IF EXISTS ais_tp_cd_nm,
  DROP COLUMN IF EXISTS cnp_cd,
  DROP COLUMN IF EXISTS cnp_cd_nm,
  DROP COLUMN IF EXISTS pan_nt_st_dt,
  DROP COLUMN IF EXISTS clsg_dt,
  DROP COLUMN IF EXISTS pan_dt,
  DROP COLUMN IF EXISTS pan_ss,
  DROP COLUMN IF EXISTS dtl_url,
  DROP COLUMN IF EXISTS dtl_url_mob,
  DROP COLUMN IF EXISTS spl_inf_tp_cd,
  DROP COLUMN IF EXISTS ccr_cnnt_sys_ds_cd,
  DROP COLUMN IF EXISTS complex_name,
  DROP COLUMN IF EXISTS address,
  ADD COLUMN IF NOT EXISTS pblanc_id text,
  ADD COLUMN IF NOT EXISTS house_sn integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pblanc_nm text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sttus_nm text,
  ADD COLUMN IF NOT EXISTS suply_instt_nm text,
  ADD COLUMN IF NOT EXISTS house_ty_nm text,
  ADD COLUMN IF NOT EXISTS suply_ty_nm text,
  ADD COLUMN IF NOT EXISTS rcrit_pblanc_de text,
  ADD COLUMN IF NOT EXISTS przwner_presnatn_de text,
  ADD COLUMN IF NOT EXISTS begin_de text,
  ADD COLUMN IF NOT EXISTS end_de text,
  ADD COLUMN IF NOT EXISTS hsmp_nm text,
  ADD COLUMN IF NOT EXISTS brtc_nm text,
  ADD COLUMN IF NOT EXISTS signgu_nm text,
  ADD COLUMN IF NOT EXISTS full_adres text,
  ADD COLUMN IF NOT EXISTS sum_suply_co integer,
  ADD COLUMN IF NOT EXISTS rent_gtn bigint,
  ADD COLUMN IF NOT EXISTS mt_rntchrg bigint,
  ADD COLUMN IF NOT EXISTS pc_url text,
  ADD COLUMN IF NOT EXISTS mobile_url text,
  ADD COLUMN IF NOT EXISTS detail_url text,
  ADD COLUMN IF NOT EXISTS heat_mthd_nm text,
  ADD COLUMN IF NOT EXISTS pnu text;

-- source는 유지 (lh_rental, lh_sale)
-- lat, lng는 유지

-- 유니크 제약 변경
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_pan_id_source_key;
ALTER TABLE announcements ADD CONSTRAINT announcements_pblanc_unique UNIQUE (pblanc_id, house_sn, source);

-- 인덱스 재생성
DROP INDEX IF EXISTS idx_announcements_pan_ss;
DROP INDEX IF EXISTS idx_announcements_upp_ais_tp_cd;
DROP INDEX IF EXISTS idx_announcements_cnp_cd;
DROP INDEX IF EXISTS idx_announcements_pan_nt_st_dt;

CREATE INDEX IF NOT EXISTS idx_announcements_brtc ON announcements(brtc_nm);
CREATE INDEX IF NOT EXISTS idx_announcements_suply_ty ON announcements(suply_ty_nm);
CREATE INDEX IF NOT EXISTS idx_announcements_rcrit_de ON announcements(rcrit_pblanc_de);
CREATE INDEX IF NOT EXISTS idx_announcements_sttus ON announcements(sttus_nm);
