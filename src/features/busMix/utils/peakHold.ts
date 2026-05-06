export type PeakHoldState = {
  peakDb: number;
  peakHoldFrames: number;
};

export const updatePeakHold = (
  currentDb: number,
  state: PeakHoldState,
  maxHoldFrames = 30,
  decayPerFrame = 1.5,
): PeakHoldState => {
  if (currentDb >= state.peakDb) {
    return { peakDb: currentDb, peakHoldFrames: 0 };
  }

  if (state.peakHoldFrames >= maxHoldFrames) {
    const nextPeak = state.peakDb - decayPerFrame;
    if (nextPeak <= currentDb) {
      return { peakDb: currentDb, peakHoldFrames: 0 };
    }

    return { peakDb: nextPeak, peakHoldFrames: state.peakHoldFrames + 1 };
  }

  return { peakDb: state.peakDb, peakHoldFrames: state.peakHoldFrames + 1 };
};
