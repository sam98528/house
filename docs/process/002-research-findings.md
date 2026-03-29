# 002 - 자료조사 결과

**날짜**: 2026-03-30
**상태**: 완료

## 공공데이터 API

### 1. LH 분양임대공고문 조회 서비스
- **Portal**: https://www.data.go.kr/data/15058530/openapi.do
- **Base URL**: `http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1`
- **인증**: `ServiceKey` query param (URL-encoded)
- **일일 한도**: 10,000건 (개발계정)
- **응답형식**: JSON
- **주요 파라미터**:
  - `PG_SZ`: 페이지 크기 (필수)
  - `PAGE`: 페이지 번호 (필수)
  - `PAN_NM`: 공고명 검색
  - `UPP_AIS_TP_CD`: 공고유형 (`01`=토지, `05`=분양주택, `06`=임대주택)
  - `CNP_CD`: 지역코드
  - `PAN_SS`: 공고상태 (공고중/접수중/접수마감/정정공고중)
  - `PAN_NT_ST_DT`: 공고게시일 (YYYY.MM.DD, 필수)
  - `CLSG_DT`: 공고마감일 (YYYY.MM.DD, 필수)
- **응답 필드**: SS_CODE, UPP_AIS_TP_NM, PAN_NM, CNP_CD_NM, PAN_SS, DTL_URL, ALL_CNT

### 2. 청약홈 분양정보 조회 서비스 (한국부동산원) ⭐ 핵심 API
- **Portal**: https://www.data.go.kr/data/15098547/openapi.do
- **Base URL**: `https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/`
- **Swagger**: `https://infuser.odcloud.kr/api/stages/37000/api-docs`
- **일일 한도**: 40,000건 (개발계정)
- **응답형식**: JSON + XML

**10개 엔드포인트**:
| # | 경로 | 설명 |
|---|------|------|
| 1 | `getAPTLttotPblancDetail` | APT 분양정보 상세 |
| 2 | `getAPTLttotPblancMdl` | APT 주택형별 상세 |
| 3 | `getUrbtyOfctlLttotPblancDetail` | 오피스텔/도시형/민간임대 상세 |
| 4 | `getUrbtyOfctlLttotPblancMdl` | 오피스텔/도시형 주택형별 상세 |
| 5 | `getRemndrLttotPblancDetail` | 무순위/잔여세대 상세 |
| 6 | `getRemndrLttotPblancMdl` | 잔여세대 주택형별 상세 |
| 7 | `getPblPvtRentLttotPblancDetail` | 공공지원 민간임대 상세 |
| 8 | `getPblPvtRentLttotPblancMdl` | 공공지원 민간임대 주택형별 상세 |
| 9 | `getOPTLttotPblancDetail` | 임의공급 상세 |
| 10 | `getOPTLttotPblancMdl` | 임의공급 주택형별 상세 |

**주요 쿼리 파라미터**:
- `page`, `perPage`: 페이지네이션
- `cond[HOUSE_MANAGE_NO::EQ]`: 주택관리번호
- `cond[PBLANC_NO::EQ]`: 공고번호
- `cond[HOUSE_NM::LIKE]`: 주택명 검색
- `cond[SUBSCRPT_AREA_CODE::EQ]`: 공급지역코드
- `cond[HSSPLY_ADRES::LIKE]`: 공급위치
- `cond[RCRIT_PBLANC_DE::GTE]` / `::LTE`: 모집공고일 범위

**주요 응답 필드**:
- `HOUSE_MANAGE_NO` (주택관리번호), `PBLANC_NO` (공고번호)
- `HOUSE_NM` (주택명), `HSSPLY_ADRES` (공급위치/주소)
- `TOT_SUPLY_HSHLDCO` (총 공급세대수)
- `RCEPT_BGNDE` / `RCEPT_ENDDE` (접수 시작/종료일)
- `PRZWNER_PRESNATN_DE` (당첨자 발표일)
- `CNTRCT_CNCLS_BGNDE` / `CNTRCT_CNCLS_ENDDE` (계약 기간)
- `MVN_PREARNGE_YM` (입주예정월)
- `BSNS_MBY_NM` (사업주체명), `MDHS_TELNO` (문의전화)

**주택형별 응답 필드**:
- `HOUSE_TY` (주택형), `SUPLY_AR` (공급면적)
- `SUPLY_HSHLDCO` (공급세대수), `SPSPLY_HSHLDCO` (특별공급)
- `LTTOT_TOP_AMOUNT` (분양최고금액)
- 특별공급 세부: `MNYCH_HSHLDCO`(다자녀), `NWWDS_HSHLDCO`(신혼부부), `LFE_FRST_HSHLDCO`(생애최초), `OLD_PARNTS_SUPORT_HSHLDCO`(노부모부양)

### 3. 청약홈 경쟁률/특별공급 신청현황 조회
- **Portal**: https://www.data.go.kr/data/15098905/openapi.do
- **Swagger**: `https://infuser.odcloud.kr/api/stages/36148/api-docs`
- **일일 한도**: 40,000건

### 4. 추가 유용 API
| API | Portal ID | 설명 |
|-----|-----------|------|
| 청약통장 통계 | 15114369 | 청약통장 관련 통계 |
| 마이홈포털 공공임대 단지정보 | 15110581 | 공공임대 단지 상세 |
| LH 공공임대주택 단지정보 | 15058476 | LH 임대단지 정보 |

## 지도 API

### Kakao Maps (선택) ⭐
- **문서**: https://developers.kakao.com/docs/latest/en/kakaomap/common
- **JS SDK**: `https://dapi.kakao.com/v2/maps/sdk.js?appkey={JAVASCRIPT_KEY}`
- **무료**: 일 30만건
- **초과 시**: HTTP 429 → 유료 전환 가능
- **장점**: 관대한 무료 티어, 한국어 문서 우수, 활발한 커뮤니티(DevTalk), 지번/도로명 모두 지원
- **단점**: REST API CORS 미지원 (서버사이드 프록시 필요)

**주요 REST API**:
- 좌표→주소: `GET /v2/local/geo/coord2address.json`
- 키워드검색: `GET /v2/local/search/keyword.json`
- 주소검색: `GET /v2/local/search/address.json`

### Naver Maps (비선택)
- Naver Cloud Platform 등록 필요
- 대표 계정만 무료 (2023.01~)
- 설정 복잡, 무료 한도 제한적
- 네이버 부동산 연동 시에만 장점

## 청약제도 요약

### 공급유형

#### 특별공급 (낮은 경쟁률, 자격조건 필요)
| 유형 | 대상 | 핵심 조건 |
|------|------|-----------|
| 다자녀가구 | 미성년 자녀 3인 이상 | 무주택 세대구성원 |
| 신혼부부 | 혼인 7년 이내 or 자녀 有 | 소득기준 적용 |
| 생애최초 | 생애 첫 주택 구매자 | 5년 이상 소득세 납부 |
| 노부모부양 | 만 65세 이상 부모 부양 | 3년 이상 동거 |
| 기관추천 | 기관 추천 대상 | 특정 자격 카테고리 |
| 청년 | 만 19~39세 | 소득/자산 기준 |
| 신생아 | 2년 내 출생 자녀 가정 | 출생 증명 |

#### 일반공급 (청약통장 필수)
- **1순위**: 가입기간 + 납입횟수 + 무주택기간 → 가점제/추첨제
- **2순위**: 나머지 청약통장 보유자

#### 무순위/잔여세대 (미달 세대)
- 선착순 100% 추첨
- 2025년 기준 무주택자만 가능
- 청약통장 불필요 (규정 강화 추세)

### 청약통장
- **주택청약종합저축**: 통합 통장 (2009~)
- 월 납입: 2만~50만원
- **공공주택(국민주택)**: 납입 횟수 중요
- **민영주택**: 예치금 잔액 중요
- **1순위 조건**: 보통 가입 12~24개월 + 12~24회 납입 (지역별 상이)

### 분양 vs 임대
| 항목 | 분양 | 임대 |
|------|------|------|
| 소유권 | 취득 | 미취득 (거주만) |
| 비용 | 분양가 전액 | 보증금 + 월세 |
| 유형 | 민간/공공 분양 | 국민임대, 행복주택, 영구임대, 장기전세 |
| 대상 | 일반 (공공은 소득기준) | 저소득층 위주 |
| 기간 | 영구 소유 | 5~50년 (유형별) |

## 사용자 맞춤 필터 설계 (확정)

### 기본 필터
1. **지역**: 시/도 → 시/군/구 (SUBSCRPT_AREA_CODE 활용)
2. **공급유형**: 분양 / 임대
3. **공고유형**: APT / 오피스텔/도시형 / 무순위/잔여 / 공공지원민간임대
4. **상태**: 접수예정 / 접수중 / 마감

### 맞춤 필터 (프로필 기반)
1. **가구유형**: 다자녀 / 신혼부부 / 생애최초 / 노부모부양 / 청년 / 신생아
2. **면적 범위**: 전용면적 (SUPLY_AR)
3. **가격 범위**: 분양최고금액 (LTTOT_TOP_AMOUNT)
4. **입주예정시기**: MVN_PREARNGE_YM

## 디자인 방향

### 참고 앱
- 청약홈 앱 (기존 UX 개선 목표)
- 직방/다방 (부동산 리스팅 UX)
- 카카오뱅크 (깔끔한 금융 UI)

### UI 원칙
- **모바일 우선**: 바텀 네비게이션 (카카오/네이버 스타일)
- **카드형 목록**: 스캔하기 쉬운 구조
- **스티키 필터바**: 상단 고정
- **정보 밀도 최적화**: 한 화면에 필요한 정보만
- **다크모드 지원**

## DB 스키마 (API 필드 기반 확정)

```sql
-- 공고 테이블 (청약홈 API 필드 매핑)
announcements (
  id uuid PRIMARY KEY,
  house_manage_no text UNIQUE,     -- 주택관리번호
  pblanc_no text,                   -- 공고번호
  house_nm text NOT NULL,           -- 주택명
  hssply_adres text,                -- 공급위치
  supply_type text NOT NULL,        -- 분양/임대
  announcement_type text NOT NULL,  -- APT/오피스텔/무순위/민간임대
  tot_suply_hshldco integer,        -- 총 공급세대수
  rcept_bgnde date,                 -- 접수시작일
  rcept_endde date,                 -- 접수종료일
  przwner_presnatn_de date,         -- 당첨자발표일
  cntrct_cncls_bgnde date,          -- 계약시작일
  cntrct_cncls_endde date,          -- 계약종료일
  mvn_prearnge_ym text,             -- 입주예정월
  bsns_mby_nm text,                 -- 사업주체명
  mdhs_telno text,                  -- 문의전화
  hmpg_adres text,                  -- 홈페이지
  subscrpt_area_code text,          -- 공급지역코드
  raw_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 주택형별 정보
announcement_models (
  id uuid PRIMARY KEY,
  announcement_id uuid REFERENCES announcements(id),
  house_ty text,                    -- 주택형
  suply_ar numeric,                 -- 공급면적(㎡)
  suply_hshldco integer,            -- 공급세대수
  spsply_hshldco integer,           -- 특별공급세대수
  lttot_top_amount bigint,          -- 분양최고금액
  mnych_hshldco integer,            -- 다자녀
  nwwds_hshldco integer,            -- 신혼부부
  lfe_frst_hshldco integer,         -- 생애최초
  old_parnts_suport_hshldco integer,-- 노부모부양
  instt_recomend_hshldco integer    -- 기관추천
);

-- 사용자 필터 설정
user_filters (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  regions text[],                   -- 관심 지역코드 배열
  supply_types text[],              -- 분양/임대
  announcement_types text[],        -- APT/오피스텔/무순위
  household_type text,              -- 특별공급 유형
  min_area numeric,
  max_area numeric,
  max_price bigint,
  notify_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 관심 공고
user_bookmarks (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  announcement_id uuid REFERENCES announcements(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);
```

## API 키 발급 절차
1. **data.go.kr**: 회원가입 → API 검색 → "활용신청" → 자동승인 → 마이페이지에서 ServiceKey 복사
2. **Kakao Maps**: developers.kakao.com 가입 → 앱 생성 → JavaScript Key 복사
3. **Kakao Login**: 같은 앱에서 카카오 로그인 활성화 → Redirect URI 설정
4. **Naver Login**: developers.naver.com 가입 → "네이버 로그인" 앱 등록 → Callback URL 설정
