import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';

type PersonalMixHeaderProps = {
    title: string;
    subtitle?: string;
    onBack: () => void;
    onSave: () => void;
    isSaving?: boolean;
    isSaveDisabled?: boolean;
};

export const PersonalMixHeader = ({
    title,
    subtitle,
    onBack,
    onSave,
    isSaving = false,
    isSaveDisabled = false,
}: PersonalMixHeaderProps): JSX.Element => (
    <View style={styles.container}>
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
        >
            <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <View style={styles.centerBlock}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Salvar"
            disabled={isSaveDisabled || isSaving}
            onPress={onSave}
            style={({ pressed }) => [
                styles.saveButton,
                (isSaveDisabled || isSaving) && styles.saveDisabled,
                pressed && !(isSaveDisabled || isSaving) && styles.savePressed,
            ]}
        >
            <Text style={styles.saveText}>{isSaving ? 'Salvando...' : 'Salvar'}</Text>
        </Pressable>
    </View>
);

const styles = StyleSheet.create({
    backButton: {
        alignItems: 'center',
        borderColor: colors.border.subtle,
        borderRadius: radius.md,
        borderWidth: 1,
        height: 40,
        justifyContent: 'center',
        width: 40,
    },
    backIcon: {
        color: colors.text.primary,
        fontSize: 20,
        fontWeight: '900',
        lineHeight: 20,
    },
    backPressed: {
        opacity: 0.7,
    },
    centerBlock: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: spacing.sm,
    },
    container: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
    },
    saveButton: {
        alignItems: 'center',
        backgroundColor: colors.button.success.background,
        borderColor: colors.button.success.border,
        borderRadius: radius.md,
        borderWidth: 1,
        height: 40,
        justifyContent: 'center',
        paddingHorizontal: spacing.sm,
    },
    saveDisabled: {
        opacity: 0.5,
    },
    savePressed: {
        opacity: 0.85,
    },
    saveText: {
        color: colors.button.success.text,
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    subtitle: {
        color: colors.text.secondary,
        fontSize: 12,
        fontWeight: '700',
        marginTop: spacing.xxs,
    },
    title: {
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: '900',
    },
});
