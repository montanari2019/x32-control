export type PeakHoldState = {
  peakDb: number;
  peakHoldFrames: number;
};

export const updatePeakHold = (
  currentDb: number,
  state: PeakHoldState,
  maxHoldFrames = 30,
): PeakHoldState => {
  if (currentDb >= state.peakDb) {
    return { peakDb: currentDb, peakHoldFrames: 0 };
  }

  if (state.peakHoldFrames >= maxHoldFrames) {
    return { peakDb: state.peakDb - 0.5, peakHoldFrames: 0 };
  }

  return { peakDb: state.peakDb, peakHoldFrames: state.peakHoldFrames + 1 };
};
