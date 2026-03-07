import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const BLUE = '#90caf9';
const BG = '#121212';
const PAPER = '#1e1e1e';

const ASN_OUTPUT = `ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *250307*2300*U*00401*000000002*0*T*>~
GS*SH*SENDERID*RECEIVERID*20250307*2300*2*X*004010~
ST*856*0002~
BSN*00*ASN001*20250307*2300*0001~
HL*1**S~
TD5*B*2*UPSN~
REF*UCB*TRACKINGXXX~
DTM*011*20250307~
HL*2*1*O~
PRF*PO123456~
HL*3*2*I~
LIN*1*VC*SKU12345~
SN1*1*100*EA~
HL*4*2*I~
LIN*2*VC*SKU67890~
SN1*2*50*EA~
CTT*2~
SE*16*0002~
GE*1*2~
IEA*1*000000002~`;

export const ASNResultScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Button click effect at frame 15
  const btnScale = interpolate(frame, [24, 34, 44], [1, 0.92, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Spinner visible frames 22-45
  const spinnerOpacity = interpolate(frame, [44, 54, 84, 94], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const spinnerRotation = frame * 8;

  // Result panel slides in at frame 50
  const resultSpring = spring({ frame: frame - 100, fps, config: { damping: 14, stiffness: 70 } });
  const resultX = interpolate(resultSpring, [0, 2], [80, 0]);
  const resultOpacity = interpolate(resultSpring, [0, 2], [0, 1]);

  // Chars to show in output
  const charsToShow = Math.floor(
    interpolate(frame, [110, 230], [0, ASN_OUTPUT.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  );

  const headerOpacity = interpolate(frame, [0, 36], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: BG, padding: '60px 100px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 36, opacity: headerOpacity }}>
        <p style={{ fontSize: 20, color: BLUE, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 600, margin: '0 0 8px 0' }}>
          Step 2
        </p>
        <h2 style={{ fontSize: 58, fontWeight: 800, color: '#fff', margin: 0 }}>Generate 856 ASN</h2>
        <p style={{ fontSize: 26, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>Advanced Ship Notice — one click away</p>
      </div>

      <div style={{ display: 'flex', gap: 40, flex: 1, alignItems: 'stretch' }}>
        {/* Left: action panel */}
        <div style={{ width: 420, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Generate button */}
          <div
            style={{
              backgroundColor: BLUE,
              color: '#000',
              borderRadius: 14,
              padding: '26px 32px',
              fontSize: 26,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              transform: `scale(${btnScale})`,
              boxShadow: `0 0 40px rgba(144,202,249,0.4)`,
            }}
          >
            {spinnerOpacity > 0.5 ? (
              <>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    border: '4px solid rgba(0,0,0,0.3)',
                    borderTopColor: '#000',
                    borderRadius: '50%',
                    opacity: spinnerOpacity,
                    transform: `rotate(${spinnerRotation}deg)`,
                  }}
                />
                Processing...
              </>
            ) : (
              <>🚚 Generate 856 ASN</>
            )}
          </div>

          {/* Success badge */}
          <div
            style={{
              backgroundColor: 'rgba(102,187,106,0.12)',
              border: '1.5px solid rgba(102,187,106,0.3)',
              borderRadius: 14,
              padding: '22px 28px',
              opacity: resultOpacity,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 32 }}>✅</span>
              <div>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#66bb6a', margin: 0 }}>856 ASN Generated!</p>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' }}>ASN #: ASN001 • 2 items</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, opacity: resultOpacity }}>
            {['📋 Copy', '⬇ Download'].map((label) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  backgroundColor: PAPER,
                  border: `1.5px solid ${BLUE}40`,
                  borderRadius: 12,
                  padding: '16px 20px',
                  fontSize: 20,
                  color: BLUE,
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: output code box */}
        <div
          style={{
            flex: 1,
            backgroundColor: PAPER,
            borderRadius: 16,
            border: `1.5px solid rgba(144,202,249,0.2)`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transform: `translateX(${resultX}px)`,
            opacity: resultOpacity,
            boxShadow: '0 8px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28c840' }} />
            <span style={{ marginLeft: 12, fontSize: 15, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
              856_ASN_ASN001.edi
            </span>
          </div>
          <div
            style={{
              flex: 1,
              padding: '20px 24px',
              fontFamily: '"Roboto Mono", "Courier New", monospace',
              fontSize: 16,
              color: '#90caf9',
              lineHeight: 1.7,
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {ASN_OUTPUT.substring(0, charsToShow)}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
