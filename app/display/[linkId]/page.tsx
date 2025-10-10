'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { markAsLaunched, getDisplayLinkById } from '@/lib/supabase';
import { useMessages } from '@/hooks/useMessages';
import { getRandomGradient } from '@/lib/utils';
import { getSoundEffects } from '@/lib/sound';
import StarBackground from '@/components/common/StarBackground';
import { Message } from '@/types/message';
import { DisplayLink } from '@/types/display-link';

interface Cannonball {
  id: string;
  uniqueId: string;
  message: Message;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  duration: number;
  fromLeft: boolean;
}

interface ExplodedStar {
  id: string;
  uniqueId: string;
  message: Message;
  x: number;
  y: number;
  color: string;
}

export default function DisplayLinkPage() {
  const params = useParams();
  const linkId = params.linkId as string;

  const [link, setLink] = useState<DisplayLink | null>(null);
  const [linkLoading, setLinkLoading] = useState(true);
  const [cannonballs, setCannonballs] = useState<Cannonball[]>([]);
  const [explodedStars, setExplodedStars] = useState<ExplodedStar[]>([]);
  const [firingCannons, setFiringCannons] = useState<Set<number>>(new Set());
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [lastLaunch, setLastLaunch] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const soundRef = useRef(getSoundEffects());

  const { messages, removeMessage } = useMessages(linkId);

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
    } finally {
      setLinkLoading(false);
    }
  };

  const cannonPositions = useMemo(() => [
    { x: 10, y: 85, index: 0, barrelEndX: 17, barrelEndY: 78 },
    { x: 35, y: 85, index: 1, barrelEndX: 42, barrelEndY: 78 },
    { x: 65, y: 85, index: 2, barrelEndX: 58, barrelEndY: 78 },
    { x: 90, y: 85, index: 3, barrelEndX: 83, barrelEndY: 78 },
  ], []);

  const launchCannonball = useCallback(() => {
    if (messages.length === 0) return;

    const now = Date.now();
    if (now - lastLaunch < 400) return;

    const message = messages[0];
    const selectedCannon = cannonPositions[Math.floor(Math.random() * 4)];
    const startX = selectedCannon.barrelEndX;
    const startY = selectedCannon.barrelEndY;
    const endX = 10 + Math.random() * 80;
    const endY = 10 + Math.random() * 70;
    const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
    const duration = 1.0 + distance / 150;
    const uniqueId = `${Date.now()}-${Math.random()}`;

    const newCannonball: Cannonball = {
      id: message.id,
      uniqueId,
      message,
      startX,
      startY,
      endX,
      endY,
      color: getRandomGradient(),
      duration,
      fromLeft: selectedCannon.index < 2,
    };

    setCannonballs((prev) => [...prev, newCannonball]);

    setFiringCannons((prev) => new Set(prev).add(selectedCannon.index));
    setTimeout(() => {
      setFiringCannons((prev) => {
        const newSet = new Set(prev);
        newSet.delete(selectedCannon.index);
        return newSet;
      });
    }, 200);

    if (soundEnabled) {
      soundRef.current.playCannonFire();
      soundRef.current.playWindWhoosh(duration);
    }

    setTimeout(() => {
      setCannonballs((prev) => prev.filter((c) => c.uniqueId !== uniqueId));

      const explodedStar: ExplodedStar = {
        id: message.id,
        uniqueId,
        message,
        x: endX,
        y: endY,
        color: newCannonball.color,
      };

      setExplodedStars((prev) => [...prev, explodedStar]);

      if (soundEnabled) {
        const variation = Math.floor(Math.random() * 5);
        soundRef.current.playExplosion(variation);
      }

      const displayDuration = 15000 + Math.random() * 15000;
      setTimeout(() => {
        setExplodedStars((prev) => prev.filter((s) => s.uniqueId !== uniqueId));
      }, displayDuration);
    }, duration * 1000);

    markAsLaunched(message.id).catch(console.error);
    removeMessage(message.id);
    // autoLaunchedIds에서도 제거 (나중에 다시 발사할 수 있도록)
    autoLaunchedIdsRef.current.delete(message.id);
    setLastLaunch(now);
  }, [messages, lastLaunch, removeMessage, cannonPositions, soundEnabled]);

  const resetAllMessages = useCallback(async () => {
    try {
      const { resetAllMessagesToUnlaunched } = await import('@/lib/supabase');
      await resetAllMessagesToUnlaunched(linkId);

      setCannonballs([]);
      setExplodedStars([]);

      // 페이지 새로고침으로 메시지 다시 로드
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset messages:', error);
      alert('메시지 리셋에 실패했습니다.');
    }
  }, [linkId]);

  useEffect(() => {
    const initAudio = async () => {
      if (!audioInitialized && soundRef.current) {
        const ctx = (soundRef.current as unknown as { audioContext?: AudioContext }).audioContext;
        if (ctx) {
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          setAudioInitialized(true);
          console.log('🔊 Audio initialized');
        }
      }
    };

    // 즉시 초기화 시도
    initAudio();

    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    window.addEventListener('touchstart', initAudio);

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, [audioInitialized]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        launchCannonball();
      } else if (e.code === 'KeyA') {
        setAutoLaunch((prev) => !prev);
      } else if (e.code === 'KeyC') {
        if (window.confirm('모든 발사된 메시지를 리셋하고 다시 발사하시겠습니까?')) {
          resetAllMessages();
        }
      } else if (e.code === 'KeyR') {
        window.location.reload();
      } else if (e.code === 'KeyS') {
        setSoundEnabled((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [launchCannonball, resetAllMessages]);

  useEffect(() => {
    const channel = new BroadcastChannel(`cannon_control_${linkId}`);

    channel.onmessage = (event) => {
      const { type } = event.data;

      switch (type) {
        case 'FIRE':
          launchCannonball();
          break;
        case 'AUTO_TOGGLE':
          setAutoLaunch((prev) => !prev);
          break;
        case 'SOUND_TOGGLE':
          setSoundEnabled((prev) => !prev);
          break;
        case 'RELOAD':
          window.location.reload();
          break;
        case 'RESET':
          resetAllMessages();
          break;
      }
    };

    return () => channel.close();
  }, [launchCannonball, resetAllMessages, linkId]);

  useEffect(() => {
    if (!autoLaunch) return;

    const interval = setInterval(() => {
      launchCannonball();
    }, 500);

    return () => clearInterval(interval);
  }, [autoLaunch, launchCannonball]);

  const autoLaunchedIdsRef = useRef<Set<string>>(new Set());
  const launchQueueRef = useRef<string[]>([]);
  const isLaunchingRef = useRef(false);

  // 순차적으로 메시지 발사
  const processLaunchQueue = useCallback(() => {
    if (isLaunchingRef.current || launchQueueRef.current.length === 0) {
      return;
    }

    isLaunchingRef.current = true;
    launchQueueRef.current.shift();

    console.log(`🚀 Launching message from queue (${launchQueueRef.current.length} remaining)`);

    setTimeout(() => {
      console.log('💥 Firing!');
      launchCannonball();
      isLaunchingRef.current = false;

      // 0.5초 후 다음 메시지 발사
      if (launchQueueRef.current.length > 0) {
        setTimeout(() => processLaunchQueue(), 500);
      }
    }, 100);
  }, [launchCannonball]);

  useEffect(() => {
    console.log('📊 Messages updated:', messages.length, messages);

    if (messages.length === 0) {
      return;
    }

    // autoLaunch 플래그가 있고 아직 발사하지 않은 메시지 찾기
    const messagesToLaunch = messages.filter(
      (msg) => msg.autoLaunch && !autoLaunchedIdsRef.current.has(msg.id)
    );

    console.log('🆕 Messages with autoLaunch (not yet launched):', messagesToLaunch.length, messagesToLaunch.map(m => m.name));

    if (messagesToLaunch.length > 0) {
      // 발사 큐에 추가
      messagesToLaunch.forEach(msg => {
        if (!launchQueueRef.current.includes(msg.id)) {
          launchQueueRef.current.push(msg.id);
          autoLaunchedIdsRef.current.add(msg.id);
        }
      });

      console.log(`📝 Added ${messagesToLaunch.length} messages to launch queue`);

      // 발사 프로세스 시작
      processLaunchQueue();
    }
  }, [messages, processLaunchQueue]);

  if (linkLoading) {
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
    <main className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-[#0A0E27] via-[#1A1B3E] to-[#2D1B4E]">
      <StarBackground />

      <AnimatePresence>
        {cannonballs.map((ball) => (
          <motion.div
            key={ball.uniqueId}
            initial={{
              left: `${ball.startX}%`,
              top: `${ball.startY}%`,
            }}
            animate={{
              left: `${ball.endX}%`,
              top: `${ball.endY}%`,
            }}
            transition={{
              duration: ball.duration,
              ease: [0.25, 0.1, 0.25, 1.0],
            }}
            className="absolute z-10 w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-600"
            style={{
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.6)',
              transform: `rotate(${Math.atan2(ball.endY - ball.startY, ball.endX - ball.startX) * 180 / Math.PI}deg)`,
            }}
          >
            <motion.div
              className="absolute top-1/2 -left-3 -translate-y-1/2 w-3 h-0.5 bg-white"
              style={{ transformOrigin: 'right' }}
            />
            <motion.div
              className="absolute top-1/2 -left-4 -translate-y-1/2"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.9, 0.5, 0.9],
              }}
              transition={{
                duration: 0.15,
                repeat: Infinity,
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-0.5 bg-orange-400"
                style={{
                  boxShadow: '0 0 6px rgba(251, 146, 60, 0.9)',
                  filter: 'blur(0.5px)',
                }}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3 bg-orange-400"
                style={{
                  boxShadow: '0 0 6px rgba(251, 146, 60, 0.9)',
                  filter: 'blur(0.5px)',
                }}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-yellow-200"
                style={{ boxShadow: '0 0 8px rgba(254, 240, 138, 1)' }}
              />
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-full bg-orange-500"
              style={{ filter: 'blur(12px)' }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {explodedStars.map((star) => (
          <motion.div
            key={star.uniqueId}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
            }}
            className="z-10"
          >
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 8, 0], opacity: [1, 0.9, 0] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full"
              style={{
                background: `radial-gradient(circle, white, ${star.color}, transparent)`,
                filter: 'blur(60px)',
              }}
            />

            {[...Array(24)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 24;
              const layer = i % 3;
              const distance = 80 + layer * 40;
              const size = 5 - layer * 0.7;

              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1.5, 0.6, 0],
                    x: [0, Math.cos(angle) * distance * 0.5, Math.cos(angle) * distance, Math.cos(angle) * (distance + 20)],
                    y: [0, Math.sin(angle) * distance * 0.5, Math.sin(angle) * distance, Math.sin(angle) * (distance + 20) + 30],
                    opacity: [1, 1, 0.8, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    ease: [0.22, 1, 0.36, 1],
                    delay: i * 0.015
                  }}
                  className="absolute rounded-full"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    background: star.color,
                    boxShadow: `0 0 20px ${star.color}, 0 0 40px ${star.color}`,
                  }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      scale: [1, 2, 1],
                      opacity: [0.6, 0, 0.6],
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: Infinity,
                    }}
                    style={{
                      background: star.color,
                      filter: 'blur(2px)',
                    }}
                  />
                </motion.div>
              );
            })}

            {[...Array(12)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 12;
              const distance = 120 + Math.random() * 40;

              return (
                <motion.div
                  key={`burst-${i}`}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: [1, 0.8, 0],
                  }}
                  transition={{
                    duration: 1.2,
                    ease: 'easeOut',
                    delay: 0.2 + i * 0.02
                  }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: star.color,
                    boxShadow: `0 0 20px ${star.color}`,
                  }}
                />
              );
            })}

            {[...Array(20)].map((_, i) => {
              const angle = Math.random() * Math.PI * 2;
              const distance = 50 + Math.random() * 120;

              return (
                <motion.div
                  key={`spark-${i}`}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance + Math.random() * 40,
                    opacity: [0, 1, 0],
                    rotate: Math.random() * 360,
                  }}
                  transition={{
                    duration: 0.8 + Math.random() * 0.6,
                    ease: 'easeOut',
                    delay: 0.1 + Math.random() * 0.3
                  }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: star.color,
                    boxShadow: `0 0 10px ${star.color}`,
                  }}
                />
              );
            })}

            {[...Array(6)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 6;

              return (
                <motion.div
                  key={`smoke-${i}`}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0.5 }}
                  animate={{
                    scale: [0, 3, 4],
                    x: Math.cos(angle) * 60,
                    y: Math.sin(angle) * 60,
                    opacity: [0.5, 0.3, 0],
                  }}
                  transition={{
                    duration: 2,
                    ease: 'easeOut',
                    delay: 0.3
                  }}
                  className="absolute w-20 h-20 rounded-full bg-gray-600"
                  style={{ filter: 'blur(20px)' }}
                />
              );
            })}

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 150 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 p-8 min-w-[280px] max-w-[500px]"
            >
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="relative"
              >
                <div
                  className="absolute inset-0 rounded-3xl blur-xl opacity-60"
                  style={{ background: star.color }}
                />

                <div className="relative">
                  <div
                    className="text-white text-sm text-center leading-relaxed mb-1 font-[var(--font-dancing-script)]"
                    style={{
                      textShadow: `
                        0 0 20px ${star.color},
                        0 0 40px ${star.color},
                        0 0 60px ${star.color},
                        0 2px 6px rgba(0,0,0,0.9),
                        0 4px 12px rgba(0,0,0,0.7)
                      `,
                    }}
                  >
                    {star.message.message}
                  </div>
                  <div
                    className="text-white/80 text-xs text-right font-[var(--font-dancing-script)]"
                    style={{
                      textShadow: `
                        0 0 15px ${star.color},
                        0 0 30px ${star.color},
                        0 2px 4px rgba(0,0,0,0.9)
                      `,
                    }}
                  >
                    - {star.message.name} -
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      {cannonPositions.map((cannon, idx) => (
        <motion.div
          key={idx}
          className="absolute bottom-4 z-20"
          style={{ left: `${cannon.x}%`, transform: 'translateX(-50%)' }}
          animate={{
            scale: firingCannons.has(idx) ? [1, 0.9, 1] : 1,
            x: firingCannons.has(idx) ? (idx < 2 ? [-8, 0] : [8, 0]) : 0,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="relative">
            <svg
              width="160"
              height="110"
              viewBox="0 0 120 80"
              className={`drop-shadow-2xl ${idx >= 2 ? 'scale-x-[-1]' : ''}`}
            >
              <ellipse cx="60" cy="65" rx="35" ry="15" fill="#4A5568" />
              <circle cx="45" cy="70" r="10" fill="#2D3748" stroke="#1A202C" strokeWidth="2" />
              <circle cx="75" cy="70" r="10" fill="#2D3748" stroke="#1A202C" strokeWidth="2" />
              <rect x="30" y="40" width="60" height="25" rx="5" fill="#718096" />
              <rect x="70" y="35" width="45" height="18" rx="9" fill="#4A5568">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 70 44"
                  to="-35 70 44"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </rect>
            </svg>
            {firingCannons.has(idx) && (
              <>
                <motion.div
                  initial={{ scale: 0, x: idx < 2 ? 110 : -110, y: -30, opacity: 1 }}
                  animate={{ scale: 2.5, x: idx < 2 ? 140 : -140, y: -45, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bg-orange-500 rounded-full blur-lg w-16 h-16"
                />
                <motion.div
                  initial={{ scale: 0, x: idx < 2 ? 115 : -115, y: -25, opacity: 1 }}
                  animate={{ scale: 2, x: idx < 2 ? 155 : -155, y: -40, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bg-yellow-400 rounded-full blur-md w-12 h-12"
                />
                <motion.div
                  initial={{ scale: 0, x: idx < 2 ? 120 : -120, y: -20, opacity: 1 }}
                  animate={{ scale: 1.5, x: idx < 2 ? 170 : -170, y: -35, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bg-white rounded-full blur-sm w-8 h-8"
                />
              </>
            )}
          </div>
        </motion.div>
      ))}

      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-20">
        <h1 className="text-white text-3xl font-bold mb-2">
          {link.name}
        </h1>
        {link.description && (
          <p className="text-white/60 text-sm">
            {link.description}
          </p>
        )}
      </div>
    </main>
  );
}
