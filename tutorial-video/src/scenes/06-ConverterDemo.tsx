import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const BLUE = '#90caf9';
const PURPLE = '#ce93d8';
const ORANGE = '#ffa726';
const BG = '#121212';
const PAPER = '#1e1e1e';

const X12_SAMPLE = `ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *250115*1200*U*00401*000000001*0*T*>~
GS*PO*SENDERID*RECEIVERID*20250115*1200*1*X*004010~
ST*850*0001~
BEG*00*NE*PO123456**20250115~`;

const JSON_SAMPLE = `[
  {
    "tag": "ISA",
    "elements": ["00", "          ", "00",
      "          ", "ZZ", "SENDERID"]
  },
  {
    "tag": "GS",
    "elements": ["PO", "SENDERID",
      "RECEIVERID", "20250115"]
  },
  {
    "tag": "ST",
    "elements": ["850", "0001"]
  },
  {
    "tag": "BEG",
    "elements": ["00", "NE", "PO123456"]
  }
]`;

export const ConverterDemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: show X12 on left (0-40)
  // Phase 2: swap icon spins (40-60)
  // Phase 3: JSON appears on right (60-120)
  const phase = frame < 40 ? 1 : frame < 60 ? 2 : 3;

  const headerOpacity = interpolate(frame, [0, 36], [0, 1], { extrapolateRight: 'clamp' });

  // Left panel (always visible)
  const leftSpring = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 70 } });
  const leftY = interpolate(leftSpring, [0, 2], [40, 0]);

  // Swap icon rotation & glow
  const swapRotation = interpolate(frame, [80, 120], [0, 180], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const swapGlow = phase === 2 ? 1 : 0;

  // Right panel slides in at phase 3
  const rightSpring = spring({ frame: frame - 124, fps, config: { damping: 14, stiffness: 70 } });
  const rightX = interpolate(rightSpring, [0, 2], [60, 0]);
  const rightOpacity = interpolate(rightSpring, [0, 2], [0, 1]);

  const rightChars = Math.floor(
    interpolate(frame, [130, 230], [0, JSON_SAMPLE.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  );

  return (
    <AbsoluteFill style={{ backgroundColor: BG, padding: '60px 100px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 36, opacity: headerOpacity }}>
        <p style={{ fontSize: 20, color: ORANGE, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 600, margin: '0 0 8px 0' }}>
          Converter Tool
        </p>
        <h2 style={{ fontSize: 58, fontWeight: 800, color: '#fff', margin: 0 }}>X12 ↔ JSON Converter</h2>
        <p style={{ fontSize: 26, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>
          Bidirectional conversion — swap with one click
        </p>
      </div>

      <div style={{ display: 'flex', gap: 32, flex: 1, alignItems: 'stretch' }}>
        {/* Left box: X12 */}
        <div
          style={{
            flex: 1, backgroundColor: PAPER, borderRadius: 16,
            border: `1.5px solid rgba(144,202,249,0.25)`,
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            transform: `translateY(${leftY}px)`,
            boxShadow: '0 8px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: '4px 14px', borderRadius: 999, backgroundColor: `${BLUE}20`, border: `1px solid ${BLUE}60`, fontSize: 16, color: BLUE, fontWeight: 600 }}>X12</div>
            <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>Input</span>
          </div>
          <div style={{ flex: 1, padding: '20px 24px', fontFamily: '"Roboto Mono","Courier New",monospace', fontSize: 16, color: BLUE, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {X12_SAMPLE}
          </div>
        </div>

        {/* Centre swap button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: '50%',
              backgroundColor: swapGlow > 0.5 ? ORANGE : PAPER,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36,
              boxShadow: swapGlow > 0.5 ? `0 0 40px ${ORANGE}` : '0 0 20px rgba(0,0,0,0.5)',
              border: `2px solid ${swapGlow > 0.5 ? ORANGE : 'rgba(255,255,255,0.1)'}`,
              transform: `rotate(${swapRotation}deg)`,
              transition: 'all 0.1s',
            }}
          >
            ⇄
          </div>
          <span style={{ fontSize: 18, color: ORANGE, fontWeight: 600 }}>Convert</span>
        </div>

        {/* Right box: JSON */}
        <div
          style={{
            flex: 1, backgroundColor: PAPER, borderRadius: 16,
            border: `1.5px solid rgba(255,167,38,0.25)`,
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            transform: `translateX(${rightX}px)`, opacity: rightOpacity,
            boxShadow: '0 8px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: '4px 14px', borderRadius: 999, backgroundColor: `${ORANGE}20`, border: `1px solid ${ORANGE}60`, fontSize: 16, color: ORANGE, fontWeight: 600 }}>JSON</div>
            <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>Output</span>
          </div>
          <div style={{ flex: 1, padding: '20px 24px', fontFamily: '"Roboto Mono","Courier New",monospace', fontSize: 16, color: ORANGE, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON_SAMPLE.substring(0, rightChars)}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
