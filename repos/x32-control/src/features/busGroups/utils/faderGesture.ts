// A vertical drag claims the fader; a mostly horizontal swipe is left to the strips ScrollView.
export const shouldClaimVerticalDrag = (dx: number, dy: number): boolean =>
  Math.abs(dy) > Math.abs(dx);
