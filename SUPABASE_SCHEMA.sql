-- K-edu 엑스포 메시지 월 데이터베이스 스키마

-- 메시지 테이블 생성
create table messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp default now(),
  name text not null check (char_length(name) <= 50),
  message text not null check (char_length(message) <= 200),
  launched boolean default false,
  launched_at timestamp
);

-- 인덱스 생성 (성능 최적화)
create index idx_messages_launched on messages(launched, created_at);
create index idx_messages_created_at on messages(created_at desc);

-- Row Level Security 활성화
alter table messages enable row level security;

-- RLS 정책 설정

-- 누구나 메시지 삽입 가능
create policy "Anyone can insert messages"
  on messages for insert to anon with check (true);

-- 누구나 모든 메시지 조회 가능
create policy "Anyone can read all messages"
  on messages for select to anon using (true);

-- 누구나 발사 상태 업데이트 가능
create policy "Anyone can update messages"
  on messages for update to anon using (true) with check (true);
