# 구글 로그인 기반 링크별 메시지 관리 시스템

## 개요

디지털 메시지 월 프로젝트에 구글 로그인 기반의 인증 시스템과 링크별 메시지 분리 기능이 추가되었습니다.

## 주요 기능

### 1. 구글 로그인 인증
- Supabase Auth를 통한 구글 OAuth 로그인
- 로그인 페이지: `/login`
- 자동 리다이렉션 및 세션 관리

### 2. 관리자 대시보드
- 경로: `/admin`
- 기능:
  - 디스플레이 링크 생성 및 관리
  - 링크별 활성화/비활성화
  - 메시지 입력 페이지 URL 생성
  - 디스플레이 페이지 URL 생성
  - 링크 삭제

### 3. 링크별 메시지 입력
- 경로: `/input/[linkId]`
- 각 링크마다 독립적인 메시지 입력 페이지
- 공개 접근 가능 (인증 불필요)

### 4. 링크별 디스플레이
- 경로: `/display/[linkId]`
- 각 링크에 속한 메시지만 표시
- 불꽃놀이 애니메이션과 함께 표시

## 디렉토리 구조

```
physics/
├── app/
│   ├── login/
│   │   └── page.tsx              # 구글 로그인 페이지
│   ├── admin/
│   │   └── page.tsx              # 관리자 대시보드
│   ├── input/
│   │   └── [linkId]/
│   │       └── page.tsx          # 링크별 메시지 입력 페이지
│   └── display/
│       ├── page.tsx              # 기존 디스플레이 (전체 메시지)
│       └── [linkId]/
│           └── page.tsx          # 링크별 디스플레이 페이지
├── lib/
│   └── supabase.ts              # Supabase 함수들 (인증, 링크, 메시지)
├── types/
│   ├── message.ts
│   └── display-link.ts          # DisplayLink 타입 정의
├── hooks/
│   └── useMessages.ts           # 링크별 메시지 훅
├── SETUP_GUIDE.md               # 설정 가이드
└── README_AUTH.md               # 이 파일
```

## 설정 방법

### 1. Supabase 구글 OAuth 설정

1. Supabase 대시보드 접속
2. **Authentication > Providers** 메뉴로 이동
3. **Google** 활성화
4. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
   - https://console.cloud.google.com/apis/credentials
   - 승인된 리디렉션 URI:
     ```
     https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
     ```
5. Client ID와 Client Secret를 Supabase에 입력

### 2. 데이터베이스 마이그레이션

Supabase 대시보드의 **SQL Editor**에서 `SETUP_GUIDE.md`에 있는 SQL 실행:

```sql
-- display_links 테이블 생성
CREATE TABLE IF NOT EXISTS public.display_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  CONSTRAINT display_links_user_id_name_key UNIQUE(user_id, name)
);

-- messages 테이블에 link_id 추가
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS link_id UUID REFERENCES public.display_links(id) ON DELETE CASCADE;

-- 인덱스 및 RLS 설정 (SETUP_GUIDE.md 참조)
```

### 3. 환경 변수 확인

`.env.local` 파일:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 사용 흐름

### 관리자 워크플로우

1. **로그인**
   - `/login` 페이지에서 구글 계정으로 로그인
   - 자동으로 `/admin` 페이지로 리다이렉트

2. **링크 생성**
   - `/admin`에서 "새 링크 생성" 버튼 클릭
   - 링크 이름 입력 (예: "1학년 1반")
   - 설명 입력 (선택사항)
   - 생성 완료

3. **링크 공유**
   - 생성된 링크의 "메시지 입력 페이지" URL 복사
   - 학생들에게 URL 공유
   - "디스플레이 페이지" URL을 대형 화면에 표시

4. **링크 관리**
   - 활성화/비활성화 토글
   - 링크 삭제 (메시지도 함께 삭제됨)

### 사용자 워크플로우

1. **메시지 입력**
   - 관리자가 공유한 `/input/[linkId]` URL 접속
   - 이름과 메시지 입력
   - "메시지 보내기" 버튼 클릭

2. **메시지 확인**
   - `/display/[linkId]` 페이지에서 메시지가 불꽃놀이와 함께 표시됨
   - 자동 발사 또는 스페이스바로 수동 발사

## API 함수

### 인증 함수
- `signInWithGoogle()` - 구글 로그인
- `signOut()` - 로그아웃
- `getCurrentUser()` - 현재 사용자 정보
- `onAuthStateChange()` - 인증 상태 변경 감지

### 링크 관리 함수
- `createDisplayLink(linkData)` - 새 링크 생성
- `getUserDisplayLinks()` - 사용자의 링크 목록
- `getDisplayLinkById(linkId)` - 링크 정보 조회
- `updateDisplayLink(linkId, updates)` - 링크 수정
- `deleteDisplayLink(linkId)` - 링크 삭제

### 메시지 함수 (링크 지원)
- `insertMessage(name, message, linkId?)` - 메시지 추가
- `getUnlaunchedMessages(limit, linkId?)` - 미발사 메시지 조회
- `subscribeToNewMessages(callback, linkId?)` - 실시간 메시지 구독
- `resetAllMessagesToUnlaunched(linkId?)` - 메시지 리셋

## 데이터베이스 스키마

### display_links 테이블
```sql
id            UUID         -- 링크 고유 ID
created_at    TIMESTAMP    -- 생성 시간
user_id       UUID         -- 소유자 (auth.users 참조)
name          TEXT         -- 링크 이름
description   TEXT         -- 링크 설명 (선택)
is_active     BOOLEAN      -- 활성화 상태
```

### messages 테이블 (업데이트)
```sql
id            UUID         -- 메시지 고유 ID
created_at    TIMESTAMP    -- 생성 시간
name          TEXT         -- 작성자 이름
message       TEXT         -- 메시지 내용
launched      BOOLEAN      -- 발사 여부
launched_at   TIMESTAMP    -- 발사 시간
link_id       UUID         -- 연결된 링크 (display_links 참조)
```

## 보안 (RLS 정책)

### display_links
- 사용자는 자신의 링크만 CRUD 가능
- 활성화된 링크는 누구나 조회 가능 (display 페이지용)

### messages
- 누구나 메시지 생성 가능 (공개 입력용)
- 활성화된 링크의 메시지는 누구나 조회 가능
- 링크 소유자만 자신의 링크 메시지 수정/삭제 가능

## 테스트

```bash
npm run dev
```

1. http://localhost:3000/login - 로그인
2. http://localhost:3000/admin - 관리자 대시보드
3. http://localhost:3000/input/[linkId] - 메시지 입력
4. http://localhost:3000/display/[linkId] - 디스플레이

## 키보드 단축키 (디스플레이 페이지)

- `Space` - 메시지 발사
- `A` - 자동 발사 토글
- `S` - 사운드 토글
- `R` - 메시지 새로고침
- `C` - 모든 메시지 리셋

## 문제 해결

### 로그인이 안 될 때
- Supabase 구글 OAuth 설정 확인
- 리다이렉션 URI 확인
- 브라우저 쿠키 설정 확인

### 메시지가 표시 안 될 때
- 링크가 활성화되어 있는지 확인
- 콘솔에서 에러 확인
- Supabase RLS 정책 확인

### 실시간 업데이트 안 될 때
- Supabase Realtime 활성화 확인
- 1초 폴링이 대체 메커니즘으로 동작

## 다음 단계

- [ ] 관리자가 메시지를 승인/거부하는 기능
- [ ] 링크별 통계 (메시지 수, 발사 수 등)
- [ ] 메시지 필터링/검색 기능
- [ ] 다크 모드 지원
- [ ] 모바일 최적화

---

생성일: 2025-10-10
버전: 1.0.0
