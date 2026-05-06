export const colors = {
    background: {
        primary: '#040B1A',
        secondary: '#0B1324',
        deep: '#07101D',
    },

    surface: {
        elevated: '#131D31',
        glassOverlay: 'rgba(255, 255, 255, 0.03)',
        screen: '#08111E',
        channelStrip: '#131E30',
        control: '#3F4856',
        modal: '#121A27',
    },

    border: {
        primary: '#1E3A5F',
        blue: '#1D6FFF',
        green: '#2ED47A',
        red: '#FF4D67',
        subtle: 'rgba(255, 255, 255, 0.08)',
        active: '#3E506F',
        channelBlue: '#1D6FFF',
        channelPink: '#B04E83',
    },

    text: {
        primary: '#FFFFFF',
        secondary: '#8A94A6',
        tertiary: '#5B6577',
        inverse: '#040B1A',
        muted: '#7E8897',
        success: '#8DFFB5',
    },

    accent: {
        primary: '#35C2FF',
    },

    status: {
        success: '#3DDC97',
        warning: '#FFB84D',
        danger: '#FF5A6A',
    },

    button: {
        success: {
            background: '#1F8E4B',
            border: '#37D973',
            text: '#95FFBC',
        },
    },

    mute: {
        active: {
            background: '#571919',
            border: '#FF4D57',
            text: '#FF8A92',
        },
        inactive: {
            background: '#202938',
            border: '#778193',
            text: '#D7DEE8',
        },
    },

    meter: {
        green: '#22AA33',
        greenBright: '#33DD44',
        yellow: '#FFB300',
        orange: '#FF4400',
        red: '#FF2222',
        clip: '#FF0000',
        peak: '#FFFFFF',
        background: '#0A0F14',
        segmentOff: {
            green: '#0A1F0E',
            yellow: '#332900',
            orange: '#351500',
            red: '#3A1010',
        },
        off: '#1A2332',
    },

    fader: {
        track: '#0C1523',
        thumb: '#454F5E',
        thumbHighlight: '#5C6777',
        thumbShadow: 'rgba(0,0,0,0.35)',
        zeroMark: '#BFC7D3',
        scaleText: '#B7C0CC',
        scaleLine: '#7E8899',
    },

    pan: {
        modalBackground: '#121A27',
        axis: '#2A364A',
        knob: '#E8EDF5',
        indicator: '#55A7FF',
    },

    overlay: {
        backdrop: 'rgba(0,0,0,0.5)',
    },

    bus: {
        vocal: '#1D6FFF',
        drums: '#2ED47A',
        guitar: '#FF4D67',
    },

    mixer: {
        neutralFader: '#6B7787',
        track: '#27313F',
    },

    x32: {
        channelColorByIndex: {
            0: '#6B7787',
            1: '#E23B3B',
            2: '#38B85E',
            3: '#F0D34A',
            4: '#397BE8',
            5: '#D34FEA',
            6: '#44C7D8',
            7: '#F4F7FA',
            8: '#C23A3A',
            9: '#2E9650',
            10: '#C9B63A',
            11: '#3267BE',
            12: '#A842BD',
            13: '#369FAC',
            14: '#9AA7B6',
            15: '#2B3645',
        } as Record<number, string>,
    },
};
