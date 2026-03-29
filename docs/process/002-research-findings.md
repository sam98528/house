# 002 - 자료조사 결과

**날짜**: 2026-03-30
**상태**: 진행중

## 공공데이터 API

### LH 분양임대 공고 API (data.go.kr)
- **서비스명**: 한국토지주택공사_분양임대공고
- **엔드포인트**: 조사 필요 (data.go.kr에서 키 발급 후 확인)
- **인증**: API Key (공공데이터포털 회원가입 → 활용신청)
- **응답형식**: XML 기본, `_type=json` 파라미터로 JSON 가능
- **주요 필드 (예상)**:
  - 공고명, 공고번호, 공급유형
  - 지역 (시도, 시군구)
  - 공급면적, 세대수
  - 접수시작일, 접수종료일
  - 당첨발표일
  - 분양가/임대료

### 추가 조사 필요
- 청약홈 (applyhome.co.kr) 크롤링 가능 여부
- 마이홈포털 API 존재 여부
- SH(서울주택도시공사) 별도 API

## 지도 API 비교

### Kakao Maps (선택)
- 일일 무료: 약 30만 건
- 한국 주소 정확도 높음
- JavaScript SDK 성숙도 높음
- 개발자 커뮤니티 활발 (devtalk.kakao.com)
- React 래퍼: react-kakao-maps-sdk

### Naver Maps
- Naver Cloud Platform 통해 제공
- 무료 사용량 제한적 (대표 계정만)
- 설정 복잡도 높음
- 지도 품질은 카카오와 동등

## 사용자 맞춤 필터 설계

### 필수 필터
1. **지역**: 시/도 → 시/군/구 (2단계 선택)
2. **공급유형**: 분양 / 임대
3. **공급방식**: 특별공급 / 일반공급 / 무순위
4. **면적**: 전용면적 범위 (㎡)
5. **상태**: 접수중 / 접수예정 / 마감

### 고급 필터 (사용자 프로필 기반)
1. **가구 유형**: 신혼부부, 다자녀, 노부모, 생애최초 등
2. **소득 기준**: 도시근로자 월평균소득 기준 비율
3. **무주택 기간**
4. **청약통장 가입 기간**
5. **부양가족 수**

## 디자인 방향

### 참고 앱
- 청약홈 앱 (기존 UX 개선 목표)
- 직방/다방 (부동산 리스팅 UX)
- 카카오뱅크 (깔끔한 금융 UI)

### UI 원칙
- **모바일 우선**: 대부분 모바일 사용자
- **정보 밀도 최적화**: 한 화면에 필요한 정보만
- **카드형 목록**: 스캔하기 쉬운 구조
- **바텀 네비게이션**: 한국 앱 UX 관행
- **다크모드 지원**

## DB 스키마 (초안)

```sql
-- 공고 테이블
announcements (
  id, title, announcement_number,
  region_sido, region_sigungu,
  supply_type (분양/임대),
  supply_method (특별/일반/무순위),
  area_sqm, unit_count,
  apply_start_date, apply_end_date,
  announce_date, move_in_date,
  price_info, detail_url,
  raw_data (jsonb),
  created_at, updated_at
)

-- 사용자 필터 설정
user_filters (
  id, user_id,
  regions (text[]),
  supply_types (text[]),
  supply_methods (text[]),
  min_area, max_area,
  household_type,
  income_level,
  notify_enabled,
  created_at, updated_at
)

-- 관심 공고
user_bookmarks (
  id, user_id, announcement_id,
  created_at
)
```
