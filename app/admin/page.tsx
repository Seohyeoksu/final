'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getCurrentUser,
  signOut,
  getUserDisplayLinks,
  createDisplayLink,
  updateDisplayLink,
  deleteDisplayLink,
  getAllMessages,
  deleteMessage,
  launchMessageById,
  resetAllMessagesToUnlaunched,
  markAllMessagesAsLaunched,
  getMessageStats,
} from '@/lib/supabase';
import { DisplayLink } from '@/types/display-link';
import { Message } from '@/types/message';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [links, setLinks] = useState<DisplayLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkDescription, setNewLinkDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // 메시지 관리 상태
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageStats, setMessageStats] = useState({ total: 0, launched: 0, unlaunched: 0 });
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState<'links' | 'messages'>('links');
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // URL에서 OAuth 토큰 제거
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      await loadLinks();
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadLinks = async () => {
    try {
      const data = await getUserDisplayLinks();
      setLinks(data);
      if (data.length > 0 && !selectedLinkId) {
        setSelectedLinkId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading links:', error);
    }
  };

  const loadMessages = async (linkId: string | null = selectedLinkId) => {
    if (!linkId) return;

    try {
      setLoadingMessages(true);
      const [messagesData, stats] = await Promise.all([
        getAllMessages(1000, linkId),
        getMessageStats(linkId)
      ]);
      setMessages(messagesData);
      setMessageStats(stats);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedLinkId && activeTab === 'messages') {
      loadMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLinkId, activeTab]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkName.trim()) return;

    try {
      setCreating(true);
      await createDisplayLink({
        name: newLinkName.trim(),
        description: newLinkDescription.trim() || undefined,
      });
      setNewLinkName('');
      setNewLinkDescription('');
      setShowCreateForm(false);
      await loadLinks();
    } catch (error) {
      console.error('Error creating link:', error);
      alert((error as Error).message || '링크 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (link: DisplayLink) => {
    try {
      await updateDisplayLink(link.id, { is_active: !link.is_active });
      await loadLinks();
    } catch (error) {
      console.error('Error updating link:', error);
      alert('링크 상태 변경에 실패했습니다.');
    }
  };

  const handleDeleteLink = async (link: DisplayLink) => {
    if (!confirm(`"${link.name}" 링크를 삭제하시겠습니까?\n모든 메시지도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      await deleteDisplayLink(link.id);
      if (selectedLinkId === link.id) {
        setSelectedLinkId(null);
        setMessages([]);
      }
      await loadLinks();
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('링크 삭제에 실패했습니다.');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('이 메시지를 삭제하시겠습니까?')) return;

    try {
      await deleteMessage(messageId);
      await loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('메시지 삭제에 실패했습니다.');
    }
  };

  const handleLaunchMessage = async (messageId: string) => {
    try {
      const msg = messages.find(m => m.id === messageId);
      console.log('🚀 Admin launching message:', {
        id: messageId,
        name: msg?.name,
        message: msg?.message
      });
      await launchMessageById(messageId);
      await loadMessages();
      console.log('✅ Message launched successfully');
    } catch (error) {
      console.error('Error launching message:', error);
      alert('메시지 발사에 실패했습니다.');
    }
  };

  const handleResetMessages = async () => {
    if (!selectedLinkId) return;
    if (!confirm('모든 메시지를 미발사 상태로 리셋하시겠습니까?')) return;

    try {
      await resetAllMessagesToUnlaunched(selectedLinkId);
      await loadMessages();
    } catch (error) {
      console.error('Error resetting messages:', error);
      alert('메시지 리셋에 실패했습니다.');
    }
  };

  const handleMarkAllLaunched = async () => {
    if (!selectedLinkId) return;
    if (!confirm('모든 대기 중인 메시지를 발사 완료로 처리하시겠습니까?')) return;

    try {
      await markAllMessagesAsLaunched(selectedLinkId);
      await loadMessages();
      alert('모든 메시지가 발사 완료 처리되었습니다.');
    } catch (error) {
      console.error('Error marking all as launched:', error);
      alert('처리에 실패했습니다.');
    }
  };

  const handleToggleSelectMessage = (messageId: string) => {
    setSelectedMessageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleSelectAllMessages = () => {
    const unlaunchedMessages = messages.filter(m => !m.launched);
    if (selectedMessageIds.size === unlaunchedMessages.length) {
      setSelectedMessageIds(new Set());
    } else {
      setSelectedMessageIds(new Set(unlaunchedMessages.map(m => m.id)));
    }
  };

  const handleLaunchSelected = async () => {
    if (selectedMessageIds.size === 0) {
      alert('발사할 메시지를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedMessageIds.size}개의 메시지를 발사하시겠습니까?`)) return;

    try {
      console.log('🚀 Launching selected messages:', Array.from(selectedMessageIds));

      // 순차적으로 발사 (0.5초 간격)
      for (const id of Array.from(selectedMessageIds)) {
        await launchMessageById(id);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setSelectedMessageIds(new Set());
      await loadMessages();
      console.log('✅ All selected messages launched');
    } catch (error) {
      console.error('Error launching selected messages:', error);
      alert('메시지 발사에 실패했습니다.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMessageIds.size === 0) {
      alert('삭제할 메시지를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedMessageIds.size}개의 메시지를 삭제하시겠습니까?`)) return;

    try {
      await Promise.all(
        Array.from(selectedMessageIds).map(id => deleteMessage(id))
      );
      setSelectedMessageIds(new Set());
      await loadMessages();
    } catch (error) {
      console.error('Error deleting selected messages:', error);
      alert('메시지 삭제에 실패했습니다.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('링크가 복사되었습니다!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1A1B3E] to-[#2D1B4E] flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1A1B3E] to-[#2D1B4E] p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-4xl font-bold mb-2">
              관리자 대시보드
            </h1>
            <p className="text-white/60">
              {user?.email || '로그인된 사용자'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            로그아웃
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('links')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'links'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            링크 관리
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'messages'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            메시지 발사 관리
          </button>
        </div>

        {/* 링크 관리 탭 */}
        {activeTab === 'links' && (
          <>
            <div className="mb-6">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold shadow-lg transition-all"
              >
                + 새 링크 생성
              </button>
            </div>

            <AnimatePresence>
              {showCreateForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 overflow-hidden"
                >
                  <form
                    onSubmit={handleCreateLink}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                  >
                    <h2 className="text-white text-xl font-semibold mb-4">
                      새 디스플레이 링크 생성
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="text-white/80 text-sm mb-2 block">
                          링크 이름 *
                        </label>
                        <input
                          type="text"
                          value={newLinkName}
                          onChange={(e) => setNewLinkName(e.target.value)}
                          placeholder="예: 1학년 1반"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-white/80 text-sm mb-2 block">
                          설명 (선택)
                        </label>
                        <input
                          type="text"
                          value={newLinkDescription}
                          onChange={(e) => setNewLinkDescription(e.target.value)}
                          placeholder="예: 1학년 1반 수업 피드백"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={creating}
                          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {creating ? '생성 중...' : '생성'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateForm(false)}
                          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {links.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center">
                  <p className="text-white/60 text-lg">
                    아직 생성된 링크가 없습니다.
                  </p>
                  <p className="text-white/40 text-sm mt-2">
                    위의 버튼을 눌러 첫 번째 링크를 생성해보세요.
                  </p>
                </div>
              ) : (
                links.map((link) => {
                  const messageInputUrl = `${window.location.origin}/input/${link.id}`;
                  const displayUrl = `${window.location.origin}/display/${link.id}`;

                  return (
                    <motion.div
                      key={link.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-white text-2xl font-semibold mb-1">
                            {link.name}
                          </h3>
                          {link.description && (
                            <p className="text-white/60 text-sm">
                              {link.description}
                            </p>
                          )}
                          <p className="text-white/40 text-xs mt-2">
                            생성일: {new Date(link.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(link)}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                              link.is_active
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            {link.is_active ? '활성화됨' : '비활성화됨'}
                          </button>
                          <button
                            onClick={() => handleDeleteLink(link)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg font-semibold text-sm transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-white/5 rounded-xl p-4">
                          <p className="text-white/80 text-sm mb-2">
                            메시지 입력 페이지
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={messageInputUrl}
                              readOnly
                              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/60 text-sm"
                            />
                            <button
                              onClick={() => copyToClipboard(messageInputUrl)}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold"
                            >
                              복사
                            </button>
                            <a
                              href={messageInputUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                            >
                              열기
                            </a>
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4">
                          <p className="text-white/80 text-sm mb-2">
                            디스플레이 페이지
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={displayUrl}
                              readOnly
                              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/60 text-sm"
                            />
                            <button
                              onClick={() => copyToClipboard(displayUrl)}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold"
                            >
                              복사
                            </button>
                            <a
                              href={displayUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                            >
                              열기
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* 메시지 관리 탭 */}
        {activeTab === 'messages' && (
          <>
            {/* 링크 선택 */}
            <div className="mb-6">
              <label className="text-white/80 text-sm mb-2 block">
                링크 선택
              </label>
              <select
                value={selectedLinkId || ''}
                onChange={(e) => setSelectedLinkId(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500"
              >
                <option value="" disabled>링크를 선택하세요</option>
                {links.map((link) => (
                  <option key={link.id} value={link.id}>
                    {link.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedLinkId && (
              <>
                {/* 통계 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <p className="text-white/60 text-sm mb-1">전체 메시지</p>
                    <p className="text-white text-3xl font-bold">{messageStats.total}</p>
                  </div>
                  <div className="bg-green-500/20 backdrop-blur-md rounded-xl p-4 border border-green-500/30">
                    <p className="text-green-200 text-sm mb-1">발사됨</p>
                    <p className="text-white text-3xl font-bold">{messageStats.launched}</p>
                  </div>
                  <div className="bg-blue-500/20 backdrop-blur-md rounded-xl p-4 border border-blue-500/30">
                    <p className="text-blue-200 text-sm mb-1">대기 중</p>
                    <p className="text-white text-3xl font-bold">{messageStats.unlaunched}</p>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-3 mb-6 flex-wrap">
                  <button
                    onClick={() => loadMessages()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                  >
                    새로고침
                  </button>
                  <button
                    onClick={handleMarkAllLaunched}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold"
                  >
                    모든 메시지 발사 완료 처리
                  </button>
                  <button
                    onClick={handleResetMessages}
                    className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold"
                  >
                    모두 리셋
                  </button>
                  {selectedMessageIds.size > 0 && (
                    <>
                      <button
                        onClick={handleLaunchSelected}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold"
                      >
                        선택한 메시지 발사 ({selectedMessageIds.size})
                      </button>
                      <button
                        onClick={handleDeleteSelected}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
                      >
                        선택한 메시지 삭제 ({selectedMessageIds.size})
                      </button>
                    </>
                  )}
                </div>

                {/* 메시지 목록 */}
                {loadingMessages ? (
                  <div className="text-center text-white/60 py-12">로딩 중...</div>
                ) : messages.length === 0 ? (
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center">
                    <p className="text-white/60 text-lg">
                      메시지가 없습니다.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 전체 선택 버튼 */}
                    <div className="mb-4">
                      <button
                        onClick={handleSelectAllMessages}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        {selectedMessageIds.size === messages.filter(m => !m.launched).length && messages.filter(m => !m.launched).length > 0
                          ? '전체 선택 해제'
                          : '미발사 메시지 전체 선택'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`bg-white/10 backdrop-blur-md rounded-xl p-4 border transition-colors ${
                            selectedMessageIds.has(msg.id)
                              ? 'border-purple-500'
                              : 'border-white/20'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* 체크박스 */}
                            {!msg.launched && (
                              <div className="pt-1">
                                <input
                                  type="checkbox"
                                  checked={selectedMessageIds.has(msg.id)}
                                  onChange={() => handleToggleSelectMessage(msg.id)}
                                  className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                                />
                              </div>
                            )}

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-white font-semibold">{msg.name}</span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  msg.launched
                                    ? 'bg-green-500/20 text-green-200'
                                    : 'bg-blue-500/20 text-blue-200'
                                }`}>
                                  {msg.launched ? '발사됨' : '대기 중'}
                                </span>
                              </div>
                              <p className="text-white/80 text-sm mb-2">{msg.message}</p>
                              <p className="text-white/40 text-xs">
                                {new Date(msg.created_at).toLocaleString('ko-KR')}
                                {msg.launched_at && ` • 발사: ${new Date(msg.launched_at).toLocaleString('ko-KR')}`}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              {!msg.launched && (
                                <button
                                  onClick={() => handleLaunchMessage(msg.id)}
                                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold"
                                >
                                  발사
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-sm font-semibold"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
