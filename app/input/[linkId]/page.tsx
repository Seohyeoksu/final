'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { insertMessage, getDisplayLinkById } from '@/lib/supabase';
import { DisplayLink } from '@/types/display-link';

export default function InputPage() {
  const params = useParams();
  const linkId = params.linkId as string;

  const [link, setLink] = useState<DisplayLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkId]);

  const loadLink = async () => {
    try {
      const linkData = await getDisplayLinkById(linkId);
      setLink(linkData);
    } catch (error) {
      console.error('Error loading link:', error);
      alert('링크를 찾을 수 없거나 비활성화되었습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    try {
      setSubmitting(true);
      await insertMessage(name.trim(), message.trim(), linkId);

      // 성공 애니메이션
      setSuccess(true);
      setName('');
      setMessage('');

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting message:', error);
      alert((error as Error).message || '메시지 전송에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1A1B3E] to-[#2D1B4E] flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1A1B3E] to-[#2D1B4E] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-white text-2xl font-bold mb-2">
            링크를 찾을 수 없습니다
          </h1>
          <p className="text-white/60">
            링크가 비활성화되었거나 존재하지 않습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1A1B3E] to-[#2D1B4E] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-6xl mb-4"
            >
              🎆
            </motion.div>
            <h1 className="text-white text-3xl font-bold mb-2">
              {link.name}
            </h1>
            {link.description && (
              <p className="text-white/60 text-sm">
                {link.description}
              </p>
            )}
          </div>

          {/* 성공 메시지 */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl"
            >
              <p className="text-green-200 text-center font-semibold">
                메시지가 전송되었습니다! 🎉
              </p>
            </motion.div>
          )}

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/80 text-sm mb-2 block">
                이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                maxLength={50}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block">
                메시지
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="미래교육에 대한 응원의 메시지를 남겨주세요"
                maxLength={200}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                required
              />
              <p className="text-white/40 text-xs mt-1 text-right">
                {message.length}/200
              </p>
            </div>

            <motion.button
              type="submit"
              disabled={submitting || !name.trim() || !message.trim()}
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '전송 중...' : '메시지 보내기 🚀'}
            </motion.button>
          </form>

          {/* 안내 메시지 */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-white/60 text-xs text-center">
              보내주신 메시지는 디지털 메시지 월에 불꽃놀이와 함께 표시됩니다.
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
