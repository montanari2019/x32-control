import { shouldClaimVerticalDrag } from '@features/busGroups/utils/faderGesture';

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
