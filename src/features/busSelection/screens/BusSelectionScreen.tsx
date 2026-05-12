import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Icons } from '@assets';
import { RootStackParamList } from '@app/navigation/RootNavigator';
import { AppHeader } from '@shared/components/AppHeader';
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
    navigation.navigate('BusGroups', {
      consoleIp,
      busNumber: bus.number,
      busName: bus.name,
      linkedBusNumber: bus.linkedBusNumber,
    });
  };

  const openAbout = (): void => {
    navigation.navigate('About');
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
            <AppHeader
              title="Selecione seu Monitor"
              subtitle={consoleName}
              onBack={() => navigation.goBack()}
              onRightPress={openAbout}
              rightAccessibilityLabel="About"
              rightContent={<Icons.Info color={colors.text.primary} width={20} height={20} />}
            />

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
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  screen: {
    padding: 0,
  },
  gridItem: {
    flex: 1,
  },
});
