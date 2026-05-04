import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { RootStackParamList } from '@app/navigation/RootNavigator';
import { ErrorState } from '@shared/components/ErrorState';
import { LoadingState } from '@shared/components/LoadingState';
import { Screen } from '@shared/components/Screen';
import { colors } from '@shared/theme/colors';
import { BusHeader } from '../components/BusHeader';
import { ChannelFader } from '../components/ChannelFader';
import { useBusMix } from '../hooks/useBusMix';
import { Channel } from '../types/Channel';

type Props = NativeStackScreenProps<RootStackParamList, 'BusMix'>;

export const BusMixScreen = ({ route }: Props): JSX.Element => {
  const { consoleIp, busName, busNumber } = route.params;
  const {
    channels,
    error,
    isLoading,
    isRefreshing,
    refresh,
    setLevel,
    toggleOn,
  } = useBusMix(consoleIp, busNumber);

  if (isLoading) {
    return (
      <Screen>
        <BusHeader
          consoleIp={consoleIp}
          busName={busName}
          busNumber={busNumber}
        />
        <LoadingState label="Carregando canais, cores e niveis..." />
      </Screen>
    );
  }

  const renderChannel = ({ item }: { item: Channel }): JSX.Element => (
    <ChannelFader
      channel={item}
      onLevelChange={(level) => setLevel(item.number, level)}
      onToggleOn={() => {
        toggleOn(item.number).catch(() => undefined);
      }}
    />
  );

  return (
    <Screen style={styles.screen}>
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <BusHeader
              consoleIp={consoleIp}
              busName={busName}
              busNumber={busNumber}
            />
            {error ? (
              <ErrorState
                message={error}
                actionLabel="Recarregar"
                onAction={refresh}
              />
            ) : null}
          </>
        }
        contentContainerStyle={styles.list}
        renderItem={renderChannel}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  screen: {
    paddingBottom: 0,
  },
});
