import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { RootStackParamList } from '@app/navigation/RootNavigator';
import { ErrorState } from '@shared/components/ErrorState';
import { LoadingState } from '@shared/components/LoadingState';
import { Screen } from '@shared/components/Screen';
import { colors } from '@shared/theme/colors';
import { BusCard } from '../components/BusCard';
import { useBusSelection } from '../hooks/useBusSelection';
import { Bus } from '../types/Bus';

type Props = NativeStackScreenProps<RootStackParamList, 'BusSelection'>;

export const BusSelectionScreen = ({ navigation, route }: Props): JSX.Element => {
  const { consoleIp, consoleName } = route.params;
  const { buses, error, isLoading, reload } = useBusSelection(consoleIp);
  const { width } = useWindowDimensions();

  const numColumns = width >= 720 ? 3 : width >= 420 ? 2 : 1;
  const gridGap = 12;

  const getBusAccentColor = (bus: Bus): string => {
    const name = bus.name.toLowerCase();
    if (name.includes('vocal')) {
      return colors.bus.vocal;
    }
    if (name.includes('bateria') || name.includes('drum')) {
      return colors.bus.drums;
    }
    if (name.includes('guit') || name.includes('baix')) {
      return colors.bus.guitar;
    }
    return colors.border.primary;
  };

  const openBus = (bus: Bus): void => {
    navigation.navigate('BusMix', {
      consoleIp,
      busNumber: bus.number,
      busName: bus.name,
      linkedBusNumber: bus.linkedBusNumber,
    });
  };

  const openSettings = (): void => {
    navigation.popToTop();
  };

  return (
    <Screen style={styles.screen}>
      <FlatList
        data={buses}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => `bus-${item.number}`}
        contentContainerStyle={[styles.listContent, { gap: gridGap }]}
        columnWrapperStyle={numColumns > 1 ? { gap: gridGap } : undefined}
        renderItem={({ item }) => (
          <BusCard
            bus={item}
            onPress={openBus}
            accentColor={getBusAccentColor(item)}
            style={numColumns > 1 ? styles.gridItem : undefined}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              >
                <Text style={styles.icon}>‹</Text>
              </Pressable>

              <View style={styles.headerCenter}>
                <Text style={styles.title}>Selecione seu Monitor</Text>
                <Text style={styles.consoleLabel}>Console</Text>
                <Text style={styles.consoleName} numberOfLines={1}>
                  {consoleName}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Configurações"
                onPress={openSettings}
                style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              >
                <Text style={styles.icon}>⚙</Text>
              </Pressable>
            </View>

            {isLoading ? <LoadingState label="Lendo nomes dos BUS..." /> : null}
            {error ? (
              <ErrorState message={error} actionLabel="Recarregar" onAction={reload} />
            ) : null}
          </View>
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 14,
    marginBottom: 16,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    paddingHorizontal: 10,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  icon: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 20,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.primary,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconButtonPressed: {
    opacity: 0.78,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  screen: {
    padding: 0,
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  consoleLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  consoleName: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  gridItem: {
    flex: 1,
  },
});
