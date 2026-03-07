import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

const BLUE = '#90caf9';
const PURPLE = '#ce93d8';
const BG = '#121212';
const PAPER = '#1e1e1e';

const features = [
  {
    icon: '📋',
    title: 'Paste Purchase Orders',
    desc: 'Accept 850 POs in X12 EDI or JSON format',
    color: BLUE,
  },
  {
    icon: '✅',
    title: 'Real-time Validation',
    desc: 'Instant segment & field-level error detection',
    color: '#66bb6a',
  },
  {
    icon: '🚚',
    title: 'Generate 856 ASN',
    desc: 'One-click Advanced Ship Notice generation',
    color: PURPLE,
  },
  {
    icon: '🧾',
    title: 'Generate 810 Invoice',
    desc: 'Automated invoice from your ASN data',
    color: '#ffa726',
  },
];

export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 40], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 40], [30, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 100px',
      }}
    >
      {/* Section label */}
      <p
        style={{
          fontSize: 22,
          color: BLUE,
          letterSpacing: 4,
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: 16,
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}
      >
        What You Can Do
      </p>

      <h2
        style={{
          fontSize: 64,
          fontWeight: 800,
          color: '#fff',
          margin: '0 0 64px 0',
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}
      >
        Key Features
      </h2>

      {/* Feature cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
          width: '100%',
          maxWidth: 1400,
        }}
      >
        {features.map((f, i) => {
          const cardSpring = spring({
            frame: frame - i * 12,
            fps,
            config: { damping: 14, stiffness: 70 },
          });
          const cardY = interpolate(cardSpring, [0, 2], [60, 0]);
          const cardOpacity = interpolate(cardSpring, [0, 2], [0, 1]);

          return (
            <div
              key={f.title}
              style={{
                backgroundColor: PAPER,
                borderRadius: 20,
                padding: '44px 48px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 28,
                border: `1.5px solid rgba(255,255,255,0.06)`,
                boxShadow: `0 0 40px rgba(0,0,0,0.4)`,
                transform: `translateY(${cardY}px)`,
                opacity: cardOpacity,
              }}
            >
              {/* Icon bubble */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  backgroundColor: `${f.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  flexShrink: 0,
                  border: `1.5px solid ${f.color}40`,
                }}
              >
                {f.icon}
              </div>

              <div>
                <h3
                  style={{
                    fontSize: 30,
                    fontWeight: 700,
                    color: f.color,
                    margin: '0 0 10px 0',
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: 22,
                    color: 'rgba(255,255,255,0.55)',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
