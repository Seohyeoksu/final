# K-edu 엑스포 - 미래교육 비전 디지털 메시지 월

교육행사용 인터랙티브 디지털 메시지 월 프로젝트입니다. 참관객들이 QR 코드를 통해 메시지를 제출하면, 무대 스크린에서 첨성대로부터 별 모양의 메시지가 발사되어 화면에 박히고, 12초간 빛나다가 사라집니다.

## 🌟 주요 기능

### 메시지 제출 페이지 (/)
- 모바일 최적화된 아름다운 폼 UI
- 이름 (최대 50자) 및 메시지 (최대 200자) 입력
- 실시간 문자 수 카운터
- 제출 성공 시 별 애니메이션
- 밤하늘 배경 + 별빛 파티클 효과

### 디스플레이 페이지 (/display)
- 전체화면 캔버스 with Matter.js 물리 엔진
- 한국 전통 첨성대 SVG 디자인
- 별의 3단계 생명주기:
  - **발사 (0-2.5초)**: 포물선 궤적, 회전, 트레일 효과
  - **고정 (2.5-15초)**: 정적 고정, 펄스 효과
  - **소멸 (15-18초)**: 점진적 축소 및 페이드아웃

## 🚀 기술 스택

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS, shadcn/ui
- **Physics**: Matter.js
- **Animation**: Framer Motion
- **Form**: React Hook Form + Zod
- **Database**: Supabase
- **Deployment**: Vercel

## 📦 설치 및 실행

### 1. 의존성 설치

\`\`\`bash
npm install
\`\`\`

### 2. Supabase 설정

#### 2.1 Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 다음 스키마 실행:

\`\`\`sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp default now(),
  name text not null check (char_length(name) <= 50),
  message text not null check (char_length(message) <= 200),
  launched boolean default false,
  launched_at timestamp
);

create index idx_messages_launched on messages(launched, created_at);
create index idx_messages_created_at on messages(created_at desc);

alter table messages enable row level security;

create policy "Anyone can insert messages"
  on messages for insert to anon with check (true);

create policy "Anyone can read unlaunched messages"
  on messages for select to anon using (launched = false);

create policy "Anyone can update launch status"
  on messages for update to anon using (true) with check (true);
\`\`\`

#### 2.2 환경 변수 설정

\`.env.local\` 파일을 수정하여 Supabase 정보 입력:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 3. 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

- 메시지 제출: http://localhost:3000
- 디스플레이: http://localhost:3000/display

## ⌨️ 디스플레이 페이지 키보드 컨트롤

| 키 | 동작 |
|---|---|
| **Space** | 별 1개 발사 |
| **Space (길게)** | 연속 발사 (0.3초 간격) |
| **A** | 자동 모드 토글 (0.5초 간격) |
| **C** | 화면 초기화 (모든 별 제거) |
| **R** | 새 메시지 로드 |

## 🎨 별의 생명주기

### 1단계: 발사 (0-2.5초)
- 첨성대 꼭대기에서 발사
- 랜덤 각도 (30-150도)
- 포물선 궤적 + 회전 애니메이션
- 물리 엔진 기반 자연스러운 움직임

### 2단계: 고정 (2.5-15초)
- 속도가 0.5 이하 또는 2.5초 경과 시 자동 고정
- \`Matter.Body.setStatic(true)\`로 정적 고정
- 박히는 애니메이션 (scale 1.0→1.2→1.0)
- 은은한 펄스 효과 (brightness 변화)

### 3단계: 소멸 (15-18초)
- 고정 후 12초 경과 시 페이드아웃 시작
- 3초간 점진적 축소 (scale 1.0→0)
- 동시에 투명도 감소 (opacity 1.0→0)
- Matter.js World에서 완전 제거

## 🎯 별 디자인

- **모양**: 원형
- **크기**: 메시지 길이에 비례 (30-75px)
- **색상**: 5가지 파스텔 그라데이션 랜덤 적용
  - 골드 (#FFF9C4→#FFD54F→#FFC107)
  - 블루 (#E1F5FE→#81D4FA→#29B6F6)
  - 퍼플 (#F3E5F5→#CE93D8→#AB47BC)
  - 오렌지 (#FFF3E0→#FFCC80→#FF9800)
  - 그린 (#E8F5E9→#A5D6A7→#66BB6A)
- **텍스트**: 중앙 정렬, 흰색, text-shadow

## 🏛️ 첨성대 디자인

- 화면 하단 중앙 배치
- 한국 전통 건축미 반영
- 돌 텍스처 (그라데이션)
- 중간 창문 (빛 효과)
- 꼭대기 발광 효과 (발사 시 밝게)

## 📱 QR 코드 생성

행사 당일 QR 코드 생성:

1. [네이버 QR 코드 생성기](https://qr.naver.com) 또는 기타 QR 생성 도구 사용
2. 배포된 URL 입력 (예: https://your-app.vercel.app)
3. QR 코드 다운로드 및 인쇄/디스플레이

## 🚀 배포 (Vercel)

### 1. GitHub에 푸시

\`\`\`bash
git add .
git commit -m "Initial commit"
git push origin main
\`\`\`

### 2. Vercel에 배포

1. [Vercel](https://vercel.com)에 로그인
2. "New Project" → GitHub 저장소 선택
3. 환경 변수 설정:
   - \`NEXT_PUBLIC_SUPABASE_URL\`
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
4. "Deploy" 클릭

## ✅ 행사 당일 체크리스트

### 준비 사항
- [ ] Supabase 데이터베이스 연결 확인
- [ ] 환경 변수 설정 확인
- [ ] 메시지 제출 테스트 (모바일 포함)
- [ ] 디스플레이 페이지 전체화면 테스트
- [ ] QR 코드 생성 및 인쇄/디스플레이
- [ ] 키보드 컨트롤 테스트

### 운영 중
1. 디스플레이 페이지를 전체화면으로 띄우기
2. Space 또는 자동 모드(A)로 별 발사
3. 필요 시 C키로 화면 초기화
4. 새 메시지 확인 시 R키로 갱신

### 문제 해결
- **별이 발사되지 않을 때**: R키로 메시지 재로드
- **화면이 너무 복잡할 때**: C키로 초기화
- **메시지가 제출되지 않을 때**: Supabase 연결 및 환경 변수 확인

## 📂 프로젝트 구조

\`\`\`
/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # 메시지 제출 페이지
│   ├── display/
│   │   └── page.tsx          # 디스플레이 페이지
│   └── globals.css
├── components/
│   ├── display/
│   │   ├── Cheomseongdae.tsx
│   │   ├── StarMessage.tsx
│   │   └── DisplayCanvas.tsx
│   ├── submit/
│   │   └── MessageForm.tsx
│   └── common/
│       └── StarBackground.tsx
├── lib/
│   ├── supabase.ts
│   ├── physics.ts
│   ├── constants.ts
│   └── utils.ts
├── hooks/
│   ├── useMessages.ts
│   └── useStarLifecycle.ts
└── types/
    └── message.ts
\`\`\`

## 🎓 컨셉

첨성대는 신라시대 천문 관측대로, 별을 관찰하고 미래를 예측하는 곳이었습니다. 이 프로젝트는 첨성대에서 미래교육에 대한 비전을 담은 별들이 발사되어 하늘에 빛나는 모습을 구현했습니다. 각 별은 참관객들의 소중한 메시지를 담고 있으며, 함께 모여 미래교육의 밝은 비전을 만들어갑니다.

## 📄 라이선스

MIT License

## 🤝 기여

이슈 및 PR을 환영합니다!
