import {
  getDragPosition,
  isTouchOnThumb,
  shouldClaimVerticalDrag,
} from '@features/busGroups/utils/faderGesture';

describe('shouldClaimVerticalDrag', () => {
  it('claims mostly vertical movement', () => {
    expect(shouldClaimVerticalDrag(2, 10)).toBe(true);
    expect(shouldClaimVerticalDrag(-3, -12)).toBe(true);
  });

  it('leaves horizontal or diagonal-equal swipes to the scroll view', () => {
    expect(shouldClaimVerticalDrag(12, 3)).toBe(false);
    expect(shouldClaimVerticalDrag(8, 8)).toBe(false);
    expect(shouldClaimVerticalDrag(0, 0)).toBe(false);
  });
});

describe('isTouchOnThumb', () => {
  const base = { centerX: 36, margin: 8, thumbHeight: 52, thumbTop: 100, thumbWidth: 32 };

  it('accepts touches within the thumb width plus margin and its vertical span', () => {
    expect(isTouchOnThumb({ ...base, x: 36, y: 120 })).toBe(true);
    expect(isTouchOnThumb({ ...base, x: 36 + 24, y: 100 })).toBe(true);
  });

  it('rejects touches beside the thumb or outside its vertical span', () => {
    expect(isTouchOnThumb({ ...base, x: 36 + 25, y: 120 })).toBe(false);
    expect(isTouchOnThumb({ ...base, x: 36, y: 99 })).toBe(false);
    expect(isTouchOnThumb({ ...base, x: 36, y: 153 })).toBe(false);
  });
});

describe('getDragPosition', () => {
  it('moves by the travel after the grant, scaled by the sensitivity', () => {
    expect(getDragPosition(200, 30, 0, 1)).toBe(230);
    expect(getDragPosition(200, 30, 0, 0.5)).toBe(215);
  });

  it('does not jump when the responder is granted mid-gesture', () => {
    expect(getDragPosition(200, 120, 120, 1)).toBe(200);
    expect(getDragPosition(200, 150, 120, 1)).toBe(230);
  });
});
