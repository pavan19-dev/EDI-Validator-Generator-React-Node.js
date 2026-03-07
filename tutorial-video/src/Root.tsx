import React from 'react';
import { Composition } from 'remotion';
import { EDITutorial } from './EDITutorial';

// Total: 30 fps × 27 s = 810 frames
const FPS = 30;
const DURATION_IN_FRAMES = 810;
const WIDTH = 1920;
const HEIGHT = 1080;

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="EDITutorial"
        component={EDITutorial}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
