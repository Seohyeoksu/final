'use client';

import { useEffect, useState, useRef } from 'react';
import { Message } from '@/types/message';
import { supabase } from '@/lib/supabase';

export function useMessages(linkId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 초기 로드: 빈 배열로 시작 (기존 메시지는 로드하지 않음)
    console.log('✅ Starting message subscription for link:', linkId || 'all');
    setMessages([]);
    setLoading(false);

    // INSERT 이벤트만 구독 - 새로 입력된 메시지만 자동 발사
    const channel = supabase.channel(`messages_realtime_${linkId || 'all'}`);

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: linkId ? `link_id=eq.${linkId}` : undefined
      },
      (payload) => {
        const newMessage = payload.new as Message;
        console.log('🎆 New message inserted:', newMessage.name);

        // 중복 방지
        if (processedIds.current.has(newMessage.id)) {
          console.log('⚠️ Already processed, skipping');
          return;
        }

        processedIds.current.add(newMessage.id);

        setMessages((prev) => {
          // 안전장치: 이미 목록에 있으면 추가하지 않음
          if (prev.some(m => m.id === newMessage.id)) {
            console.log('⚠️ Already in list, skipping');
            return prev;
          }

          console.log('✅ Adding message to queue with autoLaunch flag');
          return [...prev, { ...newMessage, autoLaunch: true }];
        });
      }
    ).subscribe();

    console.log('✅ Subscribed to INSERT events');

    return () => {
      console.log('❌ Unsubscribing from messages');
      channel.unsubscribe();
      processedIds.current.clear();
    };
  }, [linkId]);

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
    processedIds.current.delete(id);
  };

  return { messages, loading, removeMessage };
}
