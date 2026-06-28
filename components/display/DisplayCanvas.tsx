'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { createPhysicsWorld, launchStar, StarData } from '@/lib/physics';
import { getRandomGradient } from '@/lib/utils';
import { markAsLaunched } from '@/lib/supabase';
import { useMessages } from '@/hooks/useMessages';
import StarMessage from './StarMessage';
import Cheomseongdae from './Cheomseongdae';
import { TIMING } from '@/lib/constants';

export default function DisplayCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const [stars, setStars] = useState<StarData[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [autoLaunch, setAutoLaunch] = useState(false);
  const lastLaunchRef = useRef<number>(0);
  const spaceHeldRef = useRef<boolean>(false);

  const { messages, removeMessage } = useMessages();
  const [fadingStars, setFadingStars] = useState<Set<string>>(new Set());

  // Initialize physics world
  useEffect(() => {
    if (!canvasRef.current) return;

    const { engine, render } = createPhysicsWorld(canvasRef.current);
    engineRef.current = engine;
    renderRef.current = render;

    Matter.Render.run(render);
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
    };
  }, []);

  // Launch star function
  const launchStarFromQueue = useCallback(() => {
    if (!engineRef.current || messages.length === 0) return;

    const now = Date.now();
    if (now - lastLaunchRef.current < TIMING.LAUNCH_INTERVAL) return;

    const message = messages[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cheomseongdaeX = window.innerWidth / 2;
    const cheomseongdaeY = window.innerHeight - 100;

    const color = getRandomGradient();
    const newStar = launchStar(engineRef.current, cheomseongdaeX, cheomseongdaeY, message, color);

    setStars((prev) => [...prev, newStar]);
    setIsLaunching(true);
    setTimeout(() => setIsLaunching(false), 200);

    markAsLaunched(message.id).catch(console.error);
    removeMessage(message.id);
    lastLaunchRef.current = now;
  }, [messages, removeMessage]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!spaceHeldRef.current) {
          spaceHeldRef.current = true;
          launchStarFromQueue();
        }
      } else if (e.code === 'KeyA') {
        setAutoLaunch((prev) => !prev);
      } else if (e.code === 'KeyC') {
        // Clear all stars
        if (engineRef.current) {
          stars.forEach((star) => {
            Matter.World.remove(engineRef.current!.world, star.body);
          });
          setStars([]);
        }
      } else if (e.code === 'KeyR') {
        // Reload page
        window.location.reload();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [launchStarFromQueue, stars]);

  // Space held continuous launch
  useEffect(() => {
    if (!spaceHeldRef.current) return;

    const interval = setInterval(() => {
      if (spaceHeldRef.current) {
        launchStarFromQueue();
      }
    }, TIMING.LAUNCH_INTERVAL);

    return () => clearInterval(interval);
  }, [launchStarFromQueue]);

  // Auto launch mode
  useEffect(() => {
    if (!autoLaunch) return;

    const interval = setInterval(() => {
      launchStarFromQueue();
    }, TIMING.AUTO_LAUNCH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoLaunch, launchStarFromQueue]);

  // Star lifecycle management
  useEffect(() => {
    if (!engineRef.current || stars.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();

      stars.forEach((star) => {
        // Fix star if needed
        if (!star.fixedAt) {
          const velocity = Matter.Body.getVelocity(star.body);
          const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
          if (speed < 0.5 || (now - star.launchedAt) > 2500) {
            Matter.Body.setStatic(star.body, true);
            Matter.Body.setAngularVelocity(star.body, 0);
            star.fixedAt = now;
          }
        }

        // Start fading if needed
        if (star.fixedAt && (now - star.fixedAt) > 12000) {
          setFadingStars((prev) => {
            const newSet = new Set(prev);
            newSet.add(star.id);
            return newSet;
          });

          // Remove after 3 seconds
          setTimeout(() => {
            setStars((prev) => prev.filter((s) => s.id !== star.id));
            if (engineRef.current) {
              Matter.World.remove(engineRef.current.world, star.body);
            }
          }, 3000);
        }
      });
    }, 100);

    return () => clearInterval(interval);
  }, [stars]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-[#0A0E27] via-[#1A1B3E] to-[#2D1B4E]">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Render stars */}
      {stars.map((star) => (
        <StarMessage key={star.id} star={star} fadeOut={fadingStars.has(star.id)} />
      ))}

      {/* Cheomseongdae */}
      <Cheomseongdae isLaunching={isLaunching} />

      {/* Instructions */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-20">
        <h1 className="text-white text-3xl font-bold mb-2">
          수업 피드백 앱
        </h1>
        <p className="text-white/80 text-lg">
          스페이스바를 눌러 별을 띄워주세요
        </p>
      </div>

      {/* Controls Info */}
      <div className="absolute bottom-8 right-8 text-white/60 text-sm space-y-1 z-20">
        <div>Space: 별 발사</div>
        <div>Space (길게): 연속 발사</div>
        <div>A: 자동 모드 {autoLaunch ? '(ON)' : '(OFF)'}</div>
        <div>C: 화면 초기화</div>
        <div>R: 새 메시지 로드</div>
      </div>

      {/* Message Queue Info */}
      <div className="absolute bottom-8 left-8 text-white/80 text-sm z-20">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2">
          대기 중인 메시지: {messages.length}개
        </div>
      </div>
    </div>
  );
}
