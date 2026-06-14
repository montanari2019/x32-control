export type FaderThumbPalette = {
  border: string;
  centerLine: string;
  groove: string;
  surface: string;
};

export const FADER_THUMB_NEUTRAL_PALETTE: FaderThumbPalette = {
  border: '#CFCFC8',
  centerLine: '#8A8A84',
  groove: '#C8C8C2',
  surface: '#C1BFBF',
};

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

type RgbColor = {
  blue: number;
  green: number;
  red: number;
};

const normalizeHexColor = (hexColor: string): string | null => {
  const trimmedColor = hexColor.trim();
  if (!HEX_COLOR_PATTERN.test(trimmedColor)) {
    return null;
  }

  return trimmedColor.toUpperCase();
};

const hexToRgb = (hexColor: string): RgbColor => ({
  red: parseInt(hexColor.slice(1, 3), 16),
  green: parseInt(hexColor.slice(3, 5), 16),
  blue: parseInt(hexColor.slice(5, 7), 16),
});

const channelToHex = (channel: number): string =>
  Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0').toUpperCase();

const rgbToHex = ({ blue, green, red }: RgbColor): string =>
  `#${channelToHex(red)}${channelToHex(green)}${channelToHex(blue)}`;

const mixHexColors = (baseHexColor: string, targetHexColor: string, ratio: number): string => {
  const base = hexToRgb(baseHexColor);
  const target = hexToRgb(targetHexColor);

  return rgbToHex({
    red: base.red + (target.red - base.red) * ratio,
    green: base.green + (target.green - base.green) * ratio,
    blue: base.blue + (target.blue - base.blue) * ratio,
  });
};

export const getColoredFaderThumbPalette = (
  surfaceColor: string,
  borderColor?: string,
): FaderThumbPalette => {
  const surface = normalizeHexColor(surfaceColor);
  if (!surface) {
    return FADER_THUMB_NEUTRAL_PALETTE;
  }

  const explicitBorder = borderColor == null ? null : normalizeHexColor(borderColor);

  return {
    surface,
    border: explicitBorder ?? mixHexColors(surface, '#FFFFFF', 0.36),
    groove: mixHexColors(surface, '#FFFFFF', 0.18),
    centerLine: mixHexColors(surface, '#000000', 0.42),
  };
};
