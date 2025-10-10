export interface DisplayLink {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface CreateDisplayLinkData {
  name: string;
  description?: string;
}
