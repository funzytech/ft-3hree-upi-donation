import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AnimatedBrokenHeartProps {
  className?: string;
}

/**
 * Realistic 3D-shaded Broken & Reunion Heart animation with zero edge clipping.
 * Generous viewBox (-12 -10 48 44) + overflow-visible guarantees both separated
 * halves, crack highlights, connection pop-flash, and deep crimson glow stay 100%
 * visible on every single frame.
 */
export const AnimatedBrokenHeart: React.FC<AnimatedBrokenHeartProps> = ({
  className = 'w-7 h-7',
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Jagged realistic fracture path down the heart's center
  const leftHalfPath =
    'M12 5.05 C10.88 3.78 9.22 3 7.45 3 C4.38 3 2 5.42 2 8.55 C2 12.42 5.42 15.52 10.58 20.12 L12 21.38 L12.92 17.55 L10.72 14.52 L13.45 11.18 L10.62 8.15 Z';
  const rightHalfPath =
    'M12 5.05 L10.62 8.15 L13.45 11.18 L10.72 14.52 L12.92 17.55 L12 21.38 L13.42 20.12 C18.58 15.52 22 12.42 22 8.55 C22 5.42 19.62 3 16.55 3 C14.78 3 13.12 3.78 12 5.05 Z';
  const jaggedCrackPath =
    'M12 5.05 L10.62 8.15 L13.45 11.18 L10.72 14.52 L12.92 17.55 L12 21.38';
  const completeHeartPath =
    'M12 21.38 L10.58 20.12 C5.42 15.52 2 12.42 2 8.55 C2 5.42 4.38 3 7.45 3 C9.22 3 10.88 3.78 12 5.05 C13.12 3.78 14.78 3 16.55 3 C19.62 3 22 5.42 22 8.55 C22 12.42 18.58 15.52 13.42 20.12 Z';

  // Seamless 4.4s 8-stage timeline:
  // 0.00 - 0.14: Broken & separated
  // 0.14 - 0.34: Magnetic smooth reunion into exact alignment
  // 0.34 - 0.42: Exact reconnection pop-flash burst + deep crimson/amber glow surge
  // 0.42 - 0.72: Fully restored seamless complete heart with breathing deep glow
  // 0.72 - 0.80: Fine fracture line reappears (cracking effect)
  // 0.80 - 0.94: Natural outward separation with slight opposing tilt
  // 0.94 - 1.00: Settled broken state looping smoothly back to 0.00
  const cycleDuration = 4.4;
  const times = [0, 0.14, 0.34, 0.38, 0.46, 0.72, 0.78, 0.94, 1];

  if (prefersReducedMotion) {
    return (
      <span className={`relative inline-flex items-center justify-center overflow-visible shrink-0 ${className}`}>
        <svg
          className="w-full h-full overflow-visible"
          viewBox="-12 -10 48 44"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="heart3dStatic" cx="38%" cy="30%" r="72%">
              <stop offset="0%" stopColor="#ff8da1" />
              <stop offset="38%" stopColor="#f43f5e" />
              <stop offset="82%" stopColor="#be123c" />
              <stop offset="100%" stopColor="#881337" />
            </radialGradient>
          </defs>
          <path d={completeHeartPath} fill="url(#heart3dStatic)" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-visible shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      {/* Deep layered crimson-rose radial glow behind the heart (peaks on reunion) */}
      <motion.span
        className="pointer-events-none absolute -inset-2.5 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(244,63,94,0.78) 0%, rgba(225,29,72,0.38) 42%, rgba(251,146,60,0.16) 66%, transparent 78%)',
          filter: 'blur(5px)',
        }}
        animate={{
          opacity: [0.16, 0.18, 0.45, 0.96, 0.78, 0.62, 0.3, 0.16, 0.16],
          scale: [0.76, 0.78, 0.98, 1.32, 1.12, 1.06, 0.88, 0.76, 0.76],
        }}
        transition={{
          duration: cycleDuration,
          times,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.svg
        className="relative z-10 w-full h-full overflow-visible"
        viewBox="-12 -10 48 44"
        fill="none"
        animate={{
          scale: [1, 1, 1.01, 1.15, 1.05, 1.03, 1, 1, 1],
          filter: [
            'drop-shadow(0 2px 3px rgba(0,0,0,0.32))',
            'drop-shadow(0 2px 3px rgba(0,0,0,0.32))',
            'drop-shadow(0 0 5px rgba(244,63,94,0.55))',
            'drop-shadow(0 0 10px rgba(251,113,133,0.95)) drop-shadow(0 0 18px rgba(225,29,72,0.72))',
            'drop-shadow(0 0 8px rgba(244,63,94,0.8)) drop-shadow(0 0 14px rgba(251,146,60,0.45))',
            'drop-shadow(0 0 6px rgba(244,63,94,0.65))',
            'drop-shadow(0 2px 4px rgba(244,63,94,0.28))',
            'drop-shadow(0 2px 3px rgba(0,0,0,0.32))',
            'drop-shadow(0 2px 3px rgba(0,0,0,0.32))',
          ],
        }}
        transition={{
          duration: cycleDuration,
          times,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <defs>
          <radialGradient id="heart3dLeft" cx="35%" cy="28%" r="76%">
            <stop offset="0%" stopColor="#ffa4b5" />
            <stop offset="32%" stopColor="#f43f5e" />
            <stop offset="78%" stopColor="#be123c" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
          <radialGradient id="heart3dRight" cx="62%" cy="30%" r="76%">
            <stop offset="0%" stopColor="#ff94a8" />
            <stop offset="36%" stopColor="#e11d48" />
            <stop offset="80%" stopColor="#9f1239" />
            <stop offset="100%" stopColor="#6b1128" />
          </radialGradient>
          <radialGradient id="heart3dWhole" cx="36%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#ffb3c1" />
            <stop offset="30%" stopColor="#fb4c6b" />
            <stop offset="72%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#881337" />
          </radialGradient>
          <linearGradient id="crackEdgeGleam" x1="12" y1="5" x2="12" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff1f2" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#fecdd3" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0.65" />
          </linearGradient>
          <radialGradient id="reunionFlashCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="35%" stopColor="#fde68a" stopOpacity="0.82" />
            <stop offset="72%" stopColor="#fb7185" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Left Broken Half */}
        <motion.g
          style={{ originX: '12px', originY: '20.5px' }}
          animate={{
            x: [-3.4, -3.4, 0, 0, 0, 0, -0.5, -3.4, -3.4],
            y: [0.55, 0.55, 0, 0, 0, 0, 0.12, 0.55, 0.55],
            rotate: [-11.5, -11.5, 0, 0, 0, 0, -1.8, -11.5, -11.5],
          }}
          transition={{
            duration: cycleDuration,
            times,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <path d={leftHalfPath} fill="url(#heart3dLeft)" />
          {/* Glossy 3D specular highlight on upper-left lobe */}
          <ellipse
            cx="6.8"
            cy="7.3"
            rx="2.3"
            ry="1.25"
            transform="rotate(-28 6.8 7.3)"
            fill="rgba(255,255,255,0.42)"
          />
          {/* Detailed inner broken-edge highlight */}
          <motion.path
            d={jaggedCrackPath}
            stroke="url(#crackEdgeGleam)"
            strokeWidth="0.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{
              opacity: [0.85, 0.85, 0.15, 0, 0, 0, 0.9, 0.85, 0.85],
            }}
            transition={{
              duration: cycleDuration,
              times,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.g>

        {/* Right Broken Half */}
        <motion.g
          style={{ originX: '12px', originY: '20.5px' }}
          animate={{
            x: [3.4, 3.4, 0, 0, 0, 0, 0.5, 3.4, 3.4],
            y: [-0.45, -0.45, 0, 0, 0, 0, -0.1, -0.45, -0.45],
            rotate: [11.5, 11.5, 0, 0, 0, 0, 1.8, 11.5, 11.5],
          }}
          transition={{
            duration: cycleDuration,
            times,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <path d={rightHalfPath} fill="url(#heart3dRight)" />
          {/* Secondary 3D specular sheen on right lobe */}
          <ellipse
            cx="17.2"
            cy="7.4"
            rx="1.8"
            ry="0.95"
            transform="rotate(26 17.2 7.4)"
            fill="rgba(255,255,255,0.26)"
          />
          <motion.path
            d={jaggedCrackPath}
            stroke="url(#crackEdgeGleam)"
            strokeWidth="0.65"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{
              opacity: [0.78, 0.78, 0.15, 0, 0, 0, 0.85, 0.78, 0.78],
            }}
            transition={{
              duration: cycleDuration,
              times,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.g>

        {/* Complete Seamlessly Restored Heart Overlay (eliminates any hairline seam while united) */}
        <motion.g
          animate={{
            opacity: [0, 0, 0.4, 1, 1, 1, 0, 0, 0],
          }}
          transition={{
            duration: cycleDuration,
            times,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <path d={completeHeartPath} fill="url(#heart3dWhole)" />
          <ellipse
            cx="7.0"
            cy="7.3"
            rx="2.45"
            ry="1.3"
            transform="rotate(-28 7.0 7.3)"
            fill="rgba(255,255,255,0.46)"
          />
          <ellipse
            cx="17.1"
            cy="7.5"
            rx="1.75"
            ry="0.9"
            transform="rotate(26 17.1 7.5)"
            fill="rgba(255,255,255,0.24)"
          />
        </motion.g>

        {/* Cracking Seam Flash right before splitting (Stage 2 Cracking Effect) */}
        <motion.path
          d={jaggedCrackPath}
          stroke="#fff7ed"
          strokeWidth="1.05"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{
            opacity: [0, 0, 0, 0.85, 0, 0, 0.95, 0, 0],
          }}
          transition={{
            duration: cycleDuration,
            times,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Connection Pop-Flash Burst + Expanding Halo Ring (Stage 5 Connection Effect) */}
        <motion.circle
          cx="12"
          cy="12.2"
          r="9.5"
          fill="url(#reunionFlashCore)"
          style={{ originX: '12px', originY: '12.2px' }}
          animate={{
            opacity: [0, 0, 0, 0.95, 0, 0, 0, 0, 0],
            scale: [0.25, 0.25, 0.35, 1.38, 1.85, 0.25, 0.25, 0.25, 0.25],
          }}
          transition={{
            duration: cycleDuration,
            times,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
        <motion.circle
          cx="12"
          cy="12.2"
          r="11.5"
          stroke="#fde68a"
          strokeWidth="1.35"
          fill="none"
          style={{ originX: '12px', originY: '12.2px' }}
          animate={{
            opacity: [0, 0, 0, 0.9, 0, 0, 0, 0, 0],
            scale: [0.45, 0.45, 0.55, 1.25, 1.65, 0.45, 0.45, 0.45, 0.45],
          }}
          transition={{
            duration: cycleDuration,
            times,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
        {/* Crisp Micro Spark Rays at exact moment of reunion */}
        <motion.g
          stroke="#fffbeb"
          strokeWidth="1.2"
          strokeLinecap="round"
          style={{ originX: '12px', originY: '12px' }}
          animate={{
            opacity: [0, 0, 0, 0.95, 0, 0, 0, 0, 0],
            scale: [0.5, 0.5, 0.6, 1.15, 1.45, 0.5, 0.5, 0.5, 0.5],
          }}
          transition={{
            duration: cycleDuration,
            times,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        >
          <line x1="12" y1="-2.5" x2="12" y2="0.5" />
          <line x1="12" y1="23.5" x2="12" y2="26.5" />
          <line x1="-2.5" y1="12" x2="0.5" y2="12" />
          <line x1="23.5" y1="12" x2="26.5" y2="12" />
          <line x1="1.8" y1="1.8" x2="3.9" y2="3.9" />
          <line x1="22.2" y1="1.8" x2="20.1" y2="3.9" />
          <line x1="1.8" y1="22.2" x2="3.9" y2="20.1" />
          <line x1="22.2" y1="22.2" x2="20.1" y2="20.1" />
        </motion.g>
      </motion.svg>
    </span>
  );
};
