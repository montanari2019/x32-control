import { colors } from '@shared/theme/colors';

export type X32ChannelColor =
    | 'OFF'
    | 'RD'
    | 'GN'
    | 'YE'
    | 'BL'
    | 'MG'
    | 'CY'
    | 'WH'
    | 'OFFi'
    | 'RDi'
    | 'GNi'
    | 'YEi'
    | 'BLi'
    | 'MGi'
    | 'CYi'
    | 'WHi';

type UiColor = {
    backgroundColor: string;
    textColor: string;
    isInverted: boolean;
};

const indexToToken: Record<number, string> = {
    0: colors.surface.control,
    1: colors.x32.channelColorByIndex[1],
    2: colors.x32.channelColorByIndex[2],
    3: colors.x32.channelColorByIndex[3],
    4: colors.x32.channelColorByIndex[4],
    5: colors.x32.channelColorByIndex[5],
    6: colors.x32.channelColorByIndex[6],
    7: colors.x32.channelColorByIndex[7],
    8: colors.surface.control,
    9: colors.x32.channelColorByIndex[1],
    10: colors.x32.channelColorByIndex[2],
    11: colors.x32.channelColorByIndex[3],
    12: colors.x32.channelColorByIndex[4],
    13: colors.x32.channelColorByIndex[5],
    14: colors.x32.channelColorByIndex[6],
    15: colors.x32.channelColorByIndex[7],
};

const isInvertedIndex = (index: number): boolean => index >= 8;

export const mapX32ColorToUiColor = (color: X32ChannelColor | number): UiColor => {
    if (typeof color === 'number') {
        const backgroundColor = indexToToken[color] ?? colors.surface.control;
        const isInverted = isInvertedIndex(color);
        return {
            backgroundColor,
            textColor: isInverted ? colors.text.inverse : colors.text.primary,
            isInverted,
        };
    }

    if (color === 'OFF') {
        return {
            backgroundColor: colors.surface.control,
            textColor: colors.text.primary,
            isInverted: false,
        };
    }

    const isInverted = color.endsWith('i');
    const baseColor = color.replace('i', '');
    const nameMap: Record<string, number> = {
        OFF: 0,
        RD: 1,
        GN: 2,
        YE: 3,
        BL: 4,
        MG: 5,
        CY: 6,
        WH: 7,
    };
    const index = nameMap[baseColor] ?? 0;
    const tokenIndex = isInverted ? index + 8 : index;
    const backgroundColor = indexToToken[tokenIndex] ?? colors.surface.control;

    return {
        backgroundColor,
        textColor: isInverted ? colors.text.inverse : colors.text.primary,
        isInverted,
    };
};
