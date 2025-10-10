'use client';

import { motion } from 'framer-motion';
import { StarData } from '@/lib/physics';
import { TIMING } from '@/lib/constants';

interface StarMessageProps {
  star: StarData;
  fadeOut: boolean;
}

export default function StarMessage({ star, fadeOut }: StarMessageProps) {
  const radius = star.body.circleRadius || 40;
  const fontSize = Math.max(11, Math.min(15, radius / 3));
  const nameFontSize = 11;

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: star.body.position.x,
        top: star.body.position.y,
        width: radius * 2,
        height: radius * 2,
        borderRadius: '50%',
        background: star.color,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: fadeOut ? 0 : star.fixedAt ? [1, 1.2, 1] : 1,
        opacity: fadeOut ? 0 : 1,
        rotate: star.fixedAt ? 0 : star.body.angle * (180 / Math.PI),
      }}
      transition={{
        scale: {
          duration: fadeOut ? TIMING.FADE_OUT_DURATION / 1000 : star.fixedAt ? 0.4 : 0,
          ease: 'easeOut',
        },
        opacity: {
          duration: fadeOut ? TIMING.FADE_OUT_DURATION / 1000 : 0.2,
        },
        rotate: {
          duration: 0,
        },
      }}
      className={star.fixedAt && !fadeOut ? 'animate-pulse-subtle' : ''}
    >
      <div
        style={{
          fontSize: nameFontSize,
          fontWeight: 600,
          color: 'white',
          marginBottom: '4px',
          textAlign: 'center',
          wordBreak: 'break-word',
        }}
        className="text-shadow"
      >
        {star.name}
      </div>
      <div
        style={{
          fontSize,
          color: 'white',
          textAlign: 'center',
          lineHeight: 1.2,
          wordBreak: 'break-word',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
        }}
        className="text-shadow"
      >
        {star.message}
      </div>
    </motion.div>
  );
}
