import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const PURPLE = '#ce93d8';
const BG = '#121212';
const PAPER = '#1e1e1e';

const INVOICE_OUTPUT = `ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *250307*2300*U*00401*000000003*0*T*>~
GS*IN*SENDERID*RECEIVERID*20250307*2300*3*X*004010~
ST*810*0003~
BIG*20250307*INV001**PO123456~
N1*ST*BASELWAY PLAZA*92*1000~
N1*BT*BASELWAY PLAZA*92*1000~
N1*SE*SENDER INC*92*SENDERID~
IT1*1*100*EA*25.50**VC*SKU12345~
IT1*2*50*EA*42.00**VC*SKU67890~
TDS*470500~
CTT*2~
SE*12*0003~
GE*1*3~
IEA*1*000000003~`;

export const InvoiceResultScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const btnScale = interpolate(frame, [24, 34, 44], [1, 0.92, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const spinnerOpacity = interpolate(frame, [44, 54, 84, 94], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const spinnerRotation = frame * 8;

  const resultSpring = spring({ frame: frame - 100, fps, config: { damping: 14, stiffness: 70 } });
  const resultX = interpolate(resultSpring, [0, 2], [80, 0]);
  const resultOpacity = interpolate(resultSpring, [0, 2], [0, 1]);

  const charsToShow = Math.floor(
    interpolate(frame, [110, 230], [0, INVOICE_OUTPUT.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  );

  const headerOpacity = interpolate(frame, [0, 36], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: BG, padding: '60px 100px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 36, opacity: headerOpacity }}>
        <p style={{ fontSize: 20, color: PURPLE, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 600, margin: '0 0 8px 0' }}>
          Step 3
        </p>
        <h2 style={{ fontSize: 58, fontWeight: 800, color: '#fff', margin: 0 }}>Generate 810 Invoice</h2>
        <p style={{ fontSize: 26, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>
          Auto-calculated totals from your ASN data — $4,705.00
        </p>
      </div>

      <div style={{ display: 'flex', gap: 40, flex: 1, alignItems: 'stretch' }}>
        <div style={{ width: 420, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              backgroundColor: PURPLE,
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
              boxShadow: `0 0 40px rgba(206,147,216,0.4)`,
            }}
          >
            {spinnerOpacity > 0.5 ? (
              <>
                <div
                  style={{
                    width: 28, height: 28,
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
              <>🧾 Generate 810 Invoice</>
            )}
          </div>

          <div
            style={{
              backgroundColor: 'rgba(206,147,216,0.1)',
              border: '1.5px solid rgba(206,147,216,0.3)',
              borderRadius: 14,
              padding: '22px 28px',
              opacity: resultOpacity,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 32 }}>✅</span>
              <div>
                <p style={{ fontSize: 22, fontWeight: 700, color: PURPLE, margin: 0 }}>Invoice Generated!</p>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' }}>INV001 • Total: $4,705.00</p>
              </div>
            </div>
          </div>

          {/* Total amount card */}
          <div
            style={{
              backgroundColor: PAPER,
              border: '1.5px solid rgba(255,255,255,0.06)',
              borderRadius: 14,
              padding: '22px 28px',
              opacity: resultOpacity,
            }}
          >
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: 2 }}>Invoice Total</p>
            <p style={{ fontSize: 44, fontWeight: 800, color: PURPLE, margin: 0 }}>$4,705.00</p>
          </div>

          <div style={{ display: 'flex', gap: 12, opacity: resultOpacity }}>
            {['📋 Copy', '⬇ Download'].map((label) => (
              <div
                key={label}
                style={{
                  flex: 1, backgroundColor: PAPER,
                  border: `1.5px solid ${PURPLE}40`,
                  borderRadius: 12, padding: '16px 20px',
                  fontSize: 20, color: PURPLE, fontWeight: 600, textAlign: 'center',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Output code box */}
        <div
          style={{
            flex: 1, backgroundColor: PAPER, borderRadius: 16,
            border: `1.5px solid rgba(206,147,216,0.2)`,
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            transform: `translateX(${resultX}px)`, opacity: resultOpacity,
            boxShadow: '0 8px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28c840' }} />
            <span style={{ marginLeft: 12, fontSize: 15, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>810_Invoice_INV001.edi</span>
          </div>
          <div
            style={{
              flex: 1, padding: '20px 24px',
              fontFamily: '"Roboto Mono", "Courier New", monospace',
              fontSize: 16, color: PURPLE,
              lineHeight: 1.7, overflow: 'hidden',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}
          >
            {INVOICE_OUTPUT.substring(0, charsToShow)}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
