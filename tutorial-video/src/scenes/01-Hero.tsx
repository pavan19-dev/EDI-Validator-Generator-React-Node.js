import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

// Colours matching the EDI tool's dark theme
const BLUE = '#90caf9';
const PURPLE = '#ce93d8';
const BG = '#121212';
const PAPER = '#1e1e1e';

export const HeroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title slides in from left
  const titleX = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const titleTranslate = interpolate(titleX, [0, 2], [-120, 0]);
  const titleOpacity = interpolate(frame, [0, 40], [0, 1], { extrapolateRight: 'clamp' });

  // Subtitle fades in after title
  const subtitleOpacity = interpolate(frame, [50, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Badge fades in last
  const badgeOpacity = interpolate(frame, [90, 140], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Glow pulse on the accent bar
  const glowScale = 1 + 0.04 * Math.sin((frame / fps) * Math.PI * 2);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      {/* Background grid dots */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle, rgba(144,202,249,0.07) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Glowing accent bar */}
      <div
        style={{
          width: 8,
          height: 120,
          borderRadius: 4,
          background: `linear-gradient(180deg, ${BLUE}, ${PURPLE})`,
          boxShadow: `0 0 ${30 * glowScale}px ${BLUE}, 0 0 ${60 * glowScale}px ${PURPLE}`,
          marginBottom: 40,
          transform: `scaleY(${glowScale})`,
        }}
      />

      {/* Title */}
      <div
        style={{
          transform: `translateX(${titleTranslate}px)`,
          opacity: titleOpacity,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 96,
            fontWeight: 800,
            margin: 0,
            letterSpacing: -2,
            background: `linear-gradient(135deg, ${BLUE} 0%, ${PURPLE} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
          }}
        >
          EDI Validator &
        </h1>
        <h1
          style={{
            fontSize: 96,
            fontWeight: 800,
            margin: 0,
            letterSpacing: -2,
            background: `linear-gradient(135deg, ${PURPLE} 0%, ${BLUE} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
          }}
        >
          Generator
        </h1>
      </div>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 32,
          color: 'rgba(255,255,255,0.6)',
          marginTop: 28,
          opacity: subtitleOpacity,
          textAlign: 'center',
          maxWidth: 900,
          lineHeight: 1.5,
        }}
      >
        Advanced Ship Notice (856) & Invoice (810) Generator
      </p>

      {/* Badges */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 40,
          opacity: badgeOpacity,
        }}
      >
        {['VICS 4010', 'VICS 5010', 'Real-time Validation', 'X12 ↔ JSON'].map((label) => (
          <div
            key={label}
            style={{
              padding: '10px 24px',
              borderRadius: 999,
              border: `1.5px solid ${BLUE}`,
              color: BLUE,
              fontSize: 22,
              fontWeight: 500,
              backgroundColor: 'rgba(144,202,249,0.08)',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
