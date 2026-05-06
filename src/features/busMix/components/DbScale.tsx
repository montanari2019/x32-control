import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import { getDbScaleMarks } from '@shared/utils/faderDb';

type DbScaleProps = {
    height: number;
};

export const DbScale = ({ height }: DbScaleProps): JSX.Element => (
    <View style={[styles.container, { height }]}>
        {getDbScaleMarks().map((mark) => {
            const top = (1 - mark.position) * height - 6;
            return (
                <View key={`db-${mark.db}`} style={[styles.mark, { top }]}>
                    <View style={styles.line} />
                    <Text style={styles.label}>{mark.label}</Text>
                </View>
            );
        })}
    </View>
);

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: 34,
    },
    label: {
        color: colors.fader.scaleText,
        fontSize: 10,
        fontWeight: '700',
    },
    line: {
        backgroundColor: colors.fader.scaleLine,
        height: 1,
        marginRight: 4,
        width: 10,
    },
    mark: {
        alignItems: 'center',
        flexDirection: 'row',
        position: 'absolute',
        right: 0,
    },
});
