-- ================================================
-- 청약하우스 초기 스키마
-- Supabase SQL Editor에서 실행하거나 supabase db push로 적용
-- ================================================

-- 1. 공고 테이블 (LH API + 청약홈 API 데이터)
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- LH API 식별자
  pan_id text,                          -- LH 공고아이디
  pan_nm text NOT NULL,                 -- 공고명
  upp_ais_tp_cd text,                   -- 상위매물유형코드 (01,05,06,13,22,39)
  upp_ais_tp_nm text,                   -- 공고유형명 (분양주택, 임대주택 등)
  ais_tp_cd text,                       -- 매물유형코드
  ais_tp_cd_nm text,                    -- 공고세부유형명 (행복주택, 국민임대 등)
  cnp_cd text,                          -- 지역코드
  cnp_cd_nm text,                       -- 지역명

  -- 날짜 정보
  pan_nt_st_dt text,                    -- 공고게시일 (2019.07.23)
  clsg_dt text,                         -- 공고마감일
  pan_dt text,                          -- 모집공고일 (YYYYMMDD)

  -- 상태
  pan_ss text NOT NULL DEFAULT '공고중', -- 공고상태 (공고중/접수중/접수마감/상담요청/정정공고중)

  -- URL
  dtl_url text,                         -- 공고상세URL (PC)
  dtl_url_mob text,                     -- 공고상세URL (모바일)

  -- 상세 API 연동 키
  spl_inf_tp_cd text,                   -- 공급정보구분코드
  ccr_cnnt_sys_ds_cd text,              -- 고객센터연계시스템구분코드

  -- 메타
  source text NOT NULL DEFAULT 'lh',    -- 데이터 출처 (lh, applyhome)
  raw_data jsonb,                       -- 원본 API 응답
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- LH 공고는 pan_id로 중복 방지
  UNIQUE(pan_id, source)
);

-- 2. 마이홈포털 임대단지 정보
CREATE TABLE rental_complexes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  hsmp_sn bigint UNIQUE NOT NULL,       -- 단지 식별자
  instt_nm text,                        -- 기관명 (SH공사, LH서울 등)
  brtc_code text NOT NULL,              -- 광역시도 코드
  brtc_nm text,                         -- 광역시도명
  signgu_code text NOT NULL,            -- 시군구 코드
  signgu_nm text,                       -- 시군구명
  hsmp_nm text,                         -- 단지명
  rn_adres text,                        -- 도로명 주소
  pnu text,                             -- PNU 코드
  compet_de text,                       -- 준공일자 (YYYYMMDD)
  hshld_co integer,                     -- 세대수
  suply_ty_nm text,                     -- 공급유형명 (50년임대, 매입임대 등)
  style_nm text,                        -- 형명
  suply_prvuse_ar numeric,              -- 공급 전용면적 (㎡)
  suply_cmnuse_ar numeric,              -- 공급 공용면적 (㎡)
  house_ty_nm text,                     -- 주택유형명 (아파트, 다가구주택)
  heat_mthd_detail_nm text,             -- 난방방식
  buld_stle_nm text,                    -- 건물형태
  elvtr_instl_at_nm text,               -- 승강기 설치여부
  parkng_co integer,                    -- 주차수
  bass_rent_gtn bigint,                 -- 기본 임대보증금 (원)
  bass_mt_rntchrg bigint,               -- 기본 월임대료 (원)
  bass_cnvrs_gtn_lmt bigint,            -- 기본 전환보증금 (원)

  raw_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. 사용자 필터 설정
CREATE TABLE user_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 필터 조건
  regions text[] DEFAULT '{}',           -- 관심 지역코드 배열
  upp_ais_tp_cds text[] DEFAULT '{}',    -- 관심 공고유형코드 배열
  pan_ss_filter text[] DEFAULT '{}',     -- 관심 공고상태
  keyword text,                          -- 키워드 검색

  -- 알림
  notify_enabled boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id)
);

-- 4. 관심 공고 (북마크)
CREATE TABLE user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id uuid REFERENCES announcements(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),

  UNIQUE(user_id, announcement_id)
);

-- ================================================
-- 인덱스
-- ================================================
CREATE INDEX idx_announcements_pan_ss ON announcements(pan_ss);
CREATE INDEX idx_announcements_upp_ais_tp_cd ON announcements(upp_ais_tp_cd);
CREATE INDEX idx_announcements_cnp_cd ON announcements(cnp_cd);
CREATE INDEX idx_announcements_pan_nt_st_dt ON announcements(pan_nt_st_dt);
CREATE INDEX idx_announcements_source ON announcements(source);

CREATE INDEX idx_rental_complexes_brtc ON rental_complexes(brtc_code, signgu_code);
CREATE INDEX idx_rental_complexes_suply_ty ON rental_complexes(suply_ty_nm);

CREATE INDEX idx_user_bookmarks_user ON user_bookmarks(user_id);
CREATE INDEX idx_user_filters_user ON user_filters(user_id);

-- ================================================
-- Row Level Security (RLS)
-- ================================================

-- announcements: 누구나 읽기 가능
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "공고는 누구나 조회 가능" ON announcements
  FOR SELECT USING (true);
CREATE POLICY "공고 삽입은 서비스롤만" ON announcements
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "공고 수정은 서비스롤만" ON announcements
  FOR UPDATE USING (auth.role() = 'service_role');

-- rental_complexes: 누구나 읽기 가능
ALTER TABLE rental_complexes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "단지정보는 누구나 조회 가능" ON rental_complexes
  FOR SELECT USING (true);
CREATE POLICY "단지정보 삽입은 서비스롤만" ON rental_complexes
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "단지정보 수정은 서비스롤만" ON rental_complexes
  FOR UPDATE USING (auth.role() = 'service_role');

-- user_filters: 본인 데이터만
ALTER TABLE user_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 필터만 조회" ON user_filters
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 필터 생성" ON user_filters
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 필터 수정" ON user_filters
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "본인 필터 삭제" ON user_filters
  FOR DELETE USING (auth.uid() = user_id);

-- user_bookmarks: 본인 데이터만
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 북마크만 조회" ON user_bookmarks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 북마크 생성" ON user_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 북마크 삭제" ON user_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- updated_at 자동 갱신 트리거
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER rental_complexes_updated_at
  BEFORE UPDATE ON rental_complexes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_filters_updated_at
  BEFORE UPDATE ON user_filters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
