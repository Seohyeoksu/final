# 구글 로그인 설정 가이드

## 1. Supabase 설정

### 1-1. 구글 OAuth 설정

1. **Supabase 대시보드** 접속
2. **Authentication > Providers** 메뉴로 이동
3. **Google** 활성화
4. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성:
   - https://console.cloud.google.com/apis/credentials
   - OAuth 2.0 클라이언트 ID 생성
   - 승인된 리디렉션 URI에 추가:
     ```
     https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
     ```
5. 생성된 **Client ID**와 **Client Secret**를 Supabase에 입력

### 1-2. 데이터베이스 마이그레이션

Supabase 대시보드의 **SQL Editor**에서 다음 SQL을 실행하세요:

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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS messages_link_id_idx ON public.messages(link_id);
CREATE INDEX IF NOT EXISTS messages_link_id_launched_idx ON public.messages(link_id, launched);

-- RLS 활성화
ALTER TABLE public.display_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- display_links RLS 정책
CREATE POLICY "Users can view own links" ON public.display_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own links" ON public.display_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links" ON public.display_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links" ON public.display_links
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active links by id" ON public.display_links
  FOR SELECT USING (is_active = true);

-- messages RLS 정책
CREATE POLICY "Anyone can insert messages" ON public.messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view messages for active links" ON public.messages
  FOR SELECT USING (
    link_id IN (SELECT id FROM public.display_links WHERE is_active = true)
    OR link_id IS NULL
  );

CREATE POLICY "Users can update messages for their links" ON public.messages
  FOR UPDATE USING (
    link_id IN (SELECT id FROM public.display_links WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete messages for their links" ON public.messages
  FOR DELETE USING (
    link_id IN (SELECT id FROM public.display_links WHERE user_id = auth.uid())
  );
```

## 2. 환경 변수 확인

`.env.local` 파일에 다음 변수가 있는지 확인:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. 사용 방법

1. `/login` 페이지에서 구글 로그인
2. `/admin` 페이지에서 새 링크 생성
3. 생성된 링크로 메시지 입력 페이지 접속
4. `/display/[link-id]` 페이지에서 해당 링크의 메시지만 표시

## 4. 테스트

```bash
npm run dev
```

- 로그인: http://localhost:3000/login
- 관리자: http://localhost:3000/admin
