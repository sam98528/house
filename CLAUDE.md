# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**청약하우스 (ChungYak House)** — 한국토지주택공사(LH) 분양/임대 공고를 사용자 맞춤형으로 제공하는 웹 애플리케이션.
공공데이터포털 오픈API를 활용하여 청약 공고를 수집하고, 사용자의 조건(지역, 소득, 가구, 자격)에 맞는 공고만 필터링하여 보여줌.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Supabase (PostgreSQL + Auth + Row Level Security)
- **ORM**: Drizzle ORM
- **Auth**: Auth.js v5 (Kakao, Naver social login)
- **Map**: Kakao Maps JavaScript SDK
- **Deploy**: Vercel (Hobby tier)
- **Data Source**: 공공데이터포털 (data.go.kr) — LH 분양임대공고 API + 청약홈 분양정보 API

## Commands

```bash
npm run dev        # 개발 서버 (http://localhost:3000)
npm run build      # 프로덕션 빌드
npm run start      # 프로덕션 서버
npm run lint       # ESLint 실행
```

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/             # 메인 레이아웃 (네비게이션, 필터 사이드바)
│   │   ├── page.tsx        # 공고 목록 (리스트/카드 뷰)
│   │   ├── [id]/page.tsx   # 공고 상세 (지도, 단지정보, 일정)
│   │   └── favorites/      # 관심 공고
│   ├── (auth)/             # 인증 관련 페이지
│   │   └── login/page.tsx
│   ├── api/                # API Routes
│   │   ├── announcements/  # 공고 데이터 CRUD
│   │   ├── sync/           # 공공데이터 API 동기화 (Vercel Cron)
│   │   └── auth/           # Auth.js handlers
│   └── layout.tsx          # Root layout (Korean fonts, metadata)
├── components/
│   ├── ui/                 # shadcn/ui 컴포넌트
│   ├── announcement/       # 공고 관련 컴포넌트 (카드, 리스트, 필터)
│   ├── map/                # 카카오맵 컴포넌트
│   └── layout/             # 네비게이션, 사이드바, 모바일 바텀탭
├── lib/
│   ├── db/                 # Drizzle schema, client, migrations
│   ├── api/                # 공공데이터포털 API 클라이언트
│   ├── auth.ts             # Auth.js 설정
│   └── utils.ts            # 유틸리티
├── types/                  # TypeScript 타입 정의
└── hooks/                  # React hooks
```

## Key Design Decisions

- **Server Components first**: 공고 목록/상세는 SSR + ISR (revalidate: 3600)로 SEO 최적화
- **Mobile-first**: 카카오/네이버 스타일 바텀 네비게이션, 카드형 목록
- **사용자 맞춤 필터**: 지역, 공급유형(특별/일반/무순위), 분양/임대, 면적, 소득기준
- **Korean fonts**: Pretendard 또는 Noto Sans KR
- **ISR + Vercel Cron**: 매일 공공데이터 API 동기화, 페이지는 1시간 단위 재생성

## Data Flow

1. **Vercel Cron** → `/api/sync` → 공공데이터포털 API 호출 → Supabase에 공고 저장
2. **사용자 요청** → Server Component → Supabase 쿼리 (필터 적용) → 렌더링
3. **사용자 설정** → Auth.js 인증 → Supabase user_filters 테이블 → 맞춤 공고

## 청약 도메인 용어

| 용어 | 설명 |
|------|------|
| 분양 | 소유권 이전 (매매) |
| 임대 | 일정 기간 거주 (전세/월세) |
| 특별공급 | 신혼부부, 다자녀, 노부모 등 우선 공급 |
| 일반공급 | 청약통장 가입자 대상 순위별 공급 |
| 무순위/잔여세대 | 미달 세대 선착순 공급 |
| 청약통장 | 주택청약종합저축 (가입 기간 중요) |

## Environment Variables

```
# 공공데이터포털
DATA_GO_KR_API_KEY=            # data.go.kr 인증키 (encoding)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth (Kakao/Naver)
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
AUTH_SECRET=

# Kakao Maps
NEXT_PUBLIC_KAKAO_MAP_KEY=
```

## Public Data APIs (api_docs/ 참조)

### 1. LH 분양임대공고 (`src/lib/api/data-go-kr.ts`)
- **URL**: `http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1`
- **인증**: `serviceKey` (URL Encode)
- **응답**: JSON 배열 `[{dsSch}, {resHeader, dsList}]` — 일반적인 REST 응답과 다른 구조
- **필수 파라미터**: `PG_SZ`, `PAGE`, `PAN_ST_DT` (YYYYMMDD), `PAN_ED_DT` (YYYYMMDD)
- **공고유형코드**: 01=토지, 05=분양주택, 06=임대주택, 13=주거복지, 22=상가, 39=신혼희망타운
- **일일한도**: 10,000건 / TPS: 30

### 2. 마이홈포털 공공임대주택 단지정보 (`src/lib/api/myhome.ts`)
- **URL**: `https://data.myhome.go.kr/rentalHouseList`
- **인증**: `ServiceKey`
- **응답**: JSON `{ code: "000", hsmpList: [...], msg: "OK" }`
- **필수 파라미터**: `brtcCode` (광역시도 2자리), `signguCode` (시군구 3자리)
- **특이사항**: 빈 값이 `null`이 아닌 빈 객체 `{}` 로 반환됨 → `normalizeEmptyObj()` 사용
- **데이터**: 단지명, 주소, 세대수, 공급유형, 면적, 보증금/월세, 주택유형, 난방방식 등

### 3. 청약홈 분양정보 (`src/lib/api/applyhome.ts`)
- **URL**: `https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/`
- **일일한도**: 40,000건 / APT·오피스텔·무순위·민간임대 10개 엔드포인트

## Important Notes

- Next.js 16의 App Router는 기존 버전과 다를 수 있음. 코드 작성 전 `node_modules/next/dist/docs/` 가이드를 확인할 것 (AGENTS.md 참조)
- LH API는 JSON 기본. 청약홈 API도 JSON 지원 (`_type=json` 불필요)
- 카카오맵은 클라이언트 사이드 전용 — `"use client"` 필수, dynamic import 사용
- 카카오맵 REST API는 CORS 미지원 → 서버사이드 프록시 필요 (geocoding 등)
- Supabase RLS 정책으로 사용자 데이터 보호 (user_filters, user_bookmarks)
- 한국어 검색/정렬 시 locale 고려 (`Intl.Collator('ko')`)
- 프로세스 기록: `docs/process/` 디렉토리에 Obsidian 호환 마크다운으로 관리
