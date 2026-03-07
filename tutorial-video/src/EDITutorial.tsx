import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { HeroScene } from './scenes/01-Hero';
import { FeaturesScene } from './scenes/02-Features';
import { InputDemoScene } from './scenes/03-InputDemo';
import { ASNResultScene } from './scenes/04-ASNResult';
import { InvoiceResultScene } from './scenes/05-InvoiceResult';
import { ConverterDemoScene } from './scenes/06-ConverterDemo';
import { OutroScene } from './scenes/07-Outro';

// Scene durations at 30fps
// Scene 1: Hero       → 3s = 90 frames  | starts at 0
// Scene 2: Features   → 4s = 120 frames | starts at 90
// Scene 3: Input Demo → 5s = 150 frames | starts at 210
// Scene 4: ASN        → 4s = 120 frames | starts at 360
// Scene 5: Invoice    → 4s = 120 frames | starts at 480
// Scene 6: Converter  → 4s = 120 frames | starts at 600
// Scene 7: Outro      → 3s = 90 frames  | starts at 720

export const EDITutorial: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#121212', fontFamily: "'Outfit', 'Roboto', sans-serif" }}>
      <Sequence from={0} durationInFrames={90}>
        <HeroScene />
      </Sequence>
      <Sequence from={90} durationInFrames={120}>
        <FeaturesScene />
      </Sequence>
      <Sequence from={210} durationInFrames={150}>
        <InputDemoScene />
      </Sequence>
      <Sequence from={360} durationInFrames={120}>
        <ASNResultScene />
      </Sequence>
      <Sequence from={480} durationInFrames={120}>
        <InvoiceResultScene />
      </Sequence>
      <Sequence from={600} durationInFrames={120}>
        <ConverterDemoScene />
      </Sequence>
      <Sequence from={720} durationInFrames={90}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
