import { createClient } from '@supabase/supabase-js';
import { Message } from '@/types/message';
import { DisplayLink, CreateDisplayLinkData } from '@/types/display-link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// Authentication Functions
// ============================================

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/admin`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export function onAuthStateChange(callback: (user: unknown) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });
}

// ============================================
// Display Links Functions
// ============================================

export async function createDisplayLink(linkData: CreateDisplayLinkData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('display_links')
    .insert([{
      user_id: user.id,
      name: linkData.name,
      description: linkData.description || null
    }])
    .select()
    .single();

  if (error) throw error;
  return data as DisplayLink;
}

export async function getUserDisplayLinks() {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('display_links')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DisplayLink[];
}

export async function getDisplayLinkById(linkId: string) {
  const { data, error } = await supabase
    .from('display_links')
    .select('*')
    .eq('id', linkId)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data as DisplayLink;
}

export async function updateDisplayLink(linkId: string, updates: Partial<DisplayLink>) {
  const { data, error } = await supabase
    .from('display_links')
    .update(updates)
    .eq('id', linkId)
    .select()
    .single();

  if (error) throw error;
  return data as DisplayLink;
}

export async function deleteDisplayLink(linkId: string) {
  const { error } = await supabase
    .from('display_links')
    .delete()
    .eq('id', linkId);

  if (error) throw error;
}

// ============================================
// Message Functions
// ============================================

export async function insertMessage(name: string, message: string, linkId?: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      name,
      message,
      link_id: linkId || null
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Message;
}

export async function getUnlaunchedMessages(limit: number = 100, linkId?: string) {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('launched', false)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (linkId) {
    query = query.eq('link_id', linkId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Message[];
}

export async function markAsLaunched(id: string) {
  const { error } = await supabase
    .from('messages')
    .update({ launched: true, launched_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function launchMessageById(id: string) {
  console.log('📤 launchMessageById called with ID:', id);

  // 메시지 정보 가져오기
  const { data: message, error: fetchError } = await supabase
    .from('messages')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('❌ Failed to fetch message:', fetchError);
    throw fetchError;
  }

  console.log('📨 Fetched message from DB:', {
    id: message.id,
    name: message.name,
    message: message.message
  });

  // 새로운 메시지로 다시 INSERT (실시간 발사 트리거)
  const { data: newMessage, error: insertError } = await supabase
    .from('messages')
    .insert([{
      name: message.name,
      message: message.message,
      link_id: message.link_id
    }])
    .select()
    .single();

  if (insertError) {
    console.error('❌ Failed to insert message:', insertError);
    throw insertError;
  }

  console.log('✅ New message inserted:', {
    id: newMessage.id,
    name: newMessage.name,
    message: newMessage.message
  });

  // 원본 메시지는 launched로 표시
  await markAsLaunched(id);
}

export function subscribeToNewMessages(callback: (message: Message) => void, linkId?: string) {
  const channel = supabase.channel(`messages_channel_${linkId || 'all'}`);

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: linkId ? `link_id=eq.${linkId}` : undefined
    },
    (payload) => callback(payload.new as Message)
  );

  return channel.subscribe();
}

export async function resetAllMessagesToUnlaunched(linkId?: string) {
  let query = supabase
    .from('messages')
    .update({ launched: false, launched_at: null })
    .eq('launched', true);

  if (linkId) {
    query = query.eq('link_id', linkId);
  }

  const { error } = await query;
  if (error) throw error;
}

export async function markAllMessagesAsLaunched(linkId?: string) {
  let query = supabase
    .from('messages')
    .update({ launched: true, launched_at: new Date().toISOString() })
    .eq('launched', false);

  if (linkId) {
    query = query.eq('link_id', linkId);
  }

  const { error } = await query;
  if (error) throw error;
}

export async function getAllMessages(limit: number = 1000, linkId?: string) {
  let query = supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (linkId) {
    query = query.eq('link_id', linkId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Message[];
}

export async function deleteMessage(id: string) {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getMessageStats(linkId?: string) {
  let query = supabase
    .from('messages')
    .select('id, launched', { count: 'exact' });

  if (linkId) {
    query = query.eq('link_id', linkId);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  const launched = data?.filter(m => m.launched).length || 0;
  const unlaunched = (count || 0) - launched;

  return {
    total: count || 0,
    launched,
    unlaunched,
  };
}
