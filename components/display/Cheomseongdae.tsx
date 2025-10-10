'use client';

import { motion } from 'framer-motion';

interface CheomseongdaeProps {
  isLaunching?: boolean;
}

export default function Cheomseongdae({ isLaunching = false }: CheomseongdaeProps) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-10">
      <svg
        width="200"
        height="300"
        viewBox="0 0 200 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base platform */}
        <ellipse cx="100" cy="280" rx="80" ry="15" fill="#4B5563" opacity="0.8" />

        {/* Main tower body - tapered cylinder */}
        <defs>
          <linearGradient id="stoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6B7280" />
            <stop offset="50%" stopColor="#4B5563" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>

          <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* Tower body */}
        <path
          d="M 65 280 L 75 50 L 125 50 L 135 280 Z"
          fill="url(#stoneGradient)"
          stroke="#374151"
          strokeWidth="2"
        />

        {/* Stone texture lines */}
        {[80, 110, 140, 170, 200, 230, 260].map((y, i) => (
          <line
            key={i}
            x1={68 + (280 - y) * 0.035}
            y1={y}
            x2={132 - (280 - y) * 0.035}
            y2={y}
            stroke="#374151"
            strokeWidth="1.5"
            opacity="0.6"
          />
        ))}

        {/* Square window in the middle */}
        <rect
          x="85"
          y="150"
          width="30"
          height="35"
          fill="#1F2937"
          stroke="#4B5563"
          strokeWidth="2"
        />

        {/* Window light glow */}
        <rect
          x="88"
          y="153"
          width="24"
          height="29"
          fill="#FBBF24"
          opacity="0.3"
        />

        {/* Top platform */}
        <ellipse cx="100" cy="50" rx="30" ry="8" fill="#6B7280" />
        <ellipse cx="100" cy="47" rx="30" ry="8" fill="#4B5563" />

        {/* Top glow effect (animated when launching) */}
        <motion.circle
          cx="100"
          cy="40"
          r="20"
          fill="url(#glowGradient)"
          initial={{ opacity: 0.4 }}
          animate={{
            scale: isLaunching ? [1, 1.5, 1] : 1,
            opacity: isLaunching ? [0.6, 1, 0.6] : 0.4,
          }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
          }}
        />

        {/* Decorative top stones */}
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={90 + i * 6}
            y="43"
            width="5"
            height="8"
            fill="#6B7280"
            stroke="#374151"
            strokeWidth="0.5"
          />
        ))}
      </svg>
    </div>
  );
}
