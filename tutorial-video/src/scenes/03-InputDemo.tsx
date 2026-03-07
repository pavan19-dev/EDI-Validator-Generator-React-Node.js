import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const BLUE = '#90caf9';
const BG = '#121212';
const PAPER = '#1e1e1e';

const SAMPLE_X12 = `ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *250115*1200*U*00401*000000001*0*T*>~
GS*PO*SENDERID*RECEIVERID*20250115*1200*1*X*004010~
ST*850*0001~
BEG*00*NE*PO123456**20250115~
N1*ST*BASELWAY PLAZA*92*1000~
PO1*1*100*EA*25.50**VC*SKU12345~
PO1*2*50*EA*42.00**VC*SKU67890~
CTT*2~
SE*8*0001~
GE*1*1~
IEA*1*000000001~`;

export const InputDemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // How many chars of the sample to reveal (typewriter from frame 30 onward)
  const charsToShow = Math.floor(
    interpolate(frame, [60, 260], [0, SAMPLE_X12.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const headerOpacity = interpolate(frame, [0, 36], [0, 1], { extrapolateRight: 'clamp' });
  const boxSpring = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 60 } });
  const boxY = interpolate(boxSpring, [0, 2], [50, 0]);

  // Cursor blink
  const cursorVisible = Math.floor(frame / 16) % 2 === 0;

  // Validation badge fades in after text is done
  const validOpacity = interpolate(frame, [264, 296], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        padding: '60px 100px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Section header */}
      <div style={{ marginBottom: 36, opacity: headerOpacity }}>
        <p style={{ fontSize: 20, color: BLUE, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 600, margin: '0 0 8px 0' }}>
          Step 1
        </p>
        <h2 style={{ fontSize: 58, fontWeight: 800, color: '#fff', margin: 0 }}>
          Paste Your 850 Purchase Order
        </h2>
        <p style={{ fontSize: 26, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>
          Supports X12 EDI (VICS 4010 / 5010) or JSON format
        </p>
      </div>

      {/* Two-column layout: code box + info sidebar */}
      <div style={{ display: 'flex', gap: 36, flex: 1 }}>
        {/* Code editor mock */}
        <div
          style={{
            flex: 1,
            backgroundColor: PAPER,
            borderRadius: 16,
            border: '1.5px solid rgba(144,202,249,0.2)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transform: `translateY(${boxY}px)`,
            boxShadow: '0 8px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Editor title bar */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
            <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
            <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#28c840' }} />
            <span style={{ marginLeft: 12, fontSize: 16, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
              purchase_order.edi
            </span>
          </div>

          {/* Code content */}
          <div
            style={{
              flex: 1,
              padding: '24px 28px',
              fontFamily: '"Roboto Mono", "Courier New", monospace',
              fontSize: 18,
              color: '#a5d6a7',
              lineHeight: 1.7,
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {SAMPLE_X12.substring(0, charsToShow)}
            {cursorVisible && charsToShow < SAMPLE_X12.length && (
              <span style={{ color: BLUE, fontWeight: 700 }}>|</span>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 24, transform: `translateY(${boxY}px)` }}>
          {/* Format chips */}
          {[
            { label: 'Input Format', value: 'X12 EDI', color: BLUE },
            { label: 'VICS Version', value: '4010', color: '#ce93d8' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                backgroundColor: PAPER,
                borderRadius: 14,
                padding: '24px 30px',
                border: '1.5px solid rgba(255,255,255,0.06)',
              }}
            >
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: 2 }}>
                {item.label}
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
            </div>
          ))}

          {/* Validation badge */}
          <div
            style={{
              backgroundColor: 'rgba(102,187,106,0.12)',
              borderRadius: 14,
              padding: '24px 30px',
              border: '1.5px solid rgba(102,187,106,0.3)',
              opacity: validOpacity,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 32 }}>✅</span>
              <div>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#66bb6a', margin: 0 }}>Valid X12 Format</p>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' }}>All required segments found</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
