import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const BLUE = '#90caf9';
const PURPLE = '#ce93d8';
const BG = '#121212';
const PAPER = '#1e1e1e';

const summaryCards = [
  { icon: '✅', label: 'Real-time Validation', color: '#66bb6a' },
  { icon: '🚚', label: '856 ASN Generation', color: BLUE },
  { icon: '🧾', label: '810 Invoice Generation', color: PURPLE },
  { icon: '⇄', label: 'X12 ↔ JSON Converter', color: '#ffa726' },
];

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Everything fades in gently
  const mainOpacity = interpolate(frame, [0, 50], [0, 1], { extrapolateRight: 'clamp' });

  // Outro card springs in
  const cardSpring = spring({ frame: frame - 20, fps, config: { damping: 13, stiffness: 60 } });
  const cardY = interpolate(cardSpring, [0, 2], [60, 0]);

  // Stagger for mini cards
  const miniCards = summaryCards.map((_, i) => {
    const s = spring({ frame: frame - 40 - i * 10, fps, config: { damping: 13, stiffness: 70 } });
    return interpolate(s, [0, 2], [0, 1]);
  });

  // Fade out at end
  const endFade = interpolate(frame, [144, 180], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 100px',
        opacity: mainOpacity * endFade,
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          width: 600, height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(144,202,249,0.06) 0%, transparent 70%)`,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Central card */}
      <div
        style={{
          backgroundColor: PAPER,
          borderRadius: 28,
          padding: '60px 80px',
          border: `1.5px solid rgba(144,202,249,0.15)`,
          boxShadow: '0 16px 80px rgba(0,0,0,0.6)',
          textAlign: 'center',
          maxWidth: 1200,
          width: '100%',
          transform: `translateY(${cardY}px)`,
        }}
      >
        {/* Gradient title */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            margin: '0 0 16px 0',
            background: `linear-gradient(135deg, ${BLUE} 0%, ${PURPLE} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.15,
          }}
        >
          Ready to streamline your EDI workflow?
        </h1>
        <p style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', margin: '0 0 48px 0', lineHeight: 1.5 }}>
          Built with React & Material-UI · VICS 4010 / 5010 compliant
        </p>

        {/* Mini feature summary */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 48 }}>
          {summaryCards.map((card, i) => (
            <div
              key={card.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 28px', borderRadius: 999,
                backgroundColor: `${card.color}15`,
                border: `1.5px solid ${card.color}40`,
                opacity: miniCards[i],
                transform: `scale(${miniCards[i]})`,
              }}
            >
              <span style={{ fontSize: 24 }}>{card.icon}</span>
              <span style={{ fontSize: 22, color: card.color, fontWeight: 600 }}>{card.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            display: 'inline-block',
            padding: '20px 56px',
            borderRadius: 999,
            background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})`,
            fontSize: 28,
            fontWeight: 700,
            color: '#000',
            boxShadow: `0 0 60px rgba(144,202,249,0.3)`,
          }}
        >
          Start using the tool today ✨
        </div>

        <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.25)', marginTop: 32, fontFamily: 'monospace' }}>
          EDI Validator & Generator · github.com/pavan
        </p>
      </div>
    </AbsoluteFill>
  );
};
