// A vertical drag claims the fader; a mostly horizontal swipe is left to the strips ScrollView.
export const shouldClaimVerticalDrag = (dx: number, dy: number): boolean =>
  Math.abs(dy) > Math.abs(dx);

type ThumbHitInput = {
  centerX: number;
  margin: number;
  thumbHeight: number;
  thumbTop: number;
  thumbWidth: number;
  x: number;
  y: number;
};

// Touch lands on the thumb: within its width (plus a margin) and its current vertical span.
export const isTouchOnThumb = ({
  centerX,
  margin,
  thumbHeight,
  thumbTop,
  thumbWidth,
  x,
  y,
}: ThumbHitInput): boolean =>
  Math.abs(x - centerX) <= thumbWidth / 2 + margin && y >= thumbTop && y <= thumbTop + thumbHeight;

// Position of the thumb for a drag that may have been captured mid-gesture: only the travel after
// the grant (dy - grantDy) counts, so capturing late never makes the thumb jump.
export const getDragPosition = (
  startY: number,
  dy: number,
  grantDy: number,
  sensitivity: number,
): number => startY + (dy - grantDy) * sensitivity;
