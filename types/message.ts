export interface Message {
  id: string;
  created_at: string;
  name: string;
  message: string;
  launched: boolean;
  launched_at: string | null;
  autoLaunch?: boolean; // 새 메시지 자동 발사 플래그
}

export interface MessageFormData {
  name: string;
  message: string;
}
