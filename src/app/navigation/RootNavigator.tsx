import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConsoleDiscoveryScreen } from '@features/consoleDiscovery/screens/ConsoleDiscoveryScreen';
import { BusSelectionScreen } from '@features/busSelection/screens/BusSelectionScreen';
import { BusMixScreen } from '@features/busMix/screens/BusMixScreen';
import { colors } from '@shared/theme/colors';

export type RootStackParamList = {
  ConsoleDiscovery: undefined;
  BusSelection: {
    consoleIp: string;
    consoleName: string;
  };
  BusMix: {
    consoleIp: string;
    busNumber: number;
    busName: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = (): JSX.Element => (
  <Stack.Navigator
    initialRouteName="ConsoleDiscovery"
    screenOptions={{
      animation: 'slide_from_right',
      contentStyle: { backgroundColor: colors.background },
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <Stack.Screen
      name="ConsoleDiscovery"
      component={ConsoleDiscoveryScreen}
      options={{ title: 'X32/M32' }}
    />
    <Stack.Screen
      name="BusSelection"
      component={BusSelectionScreen}
      options={{ title: 'Selecionar BUS' }}
    />
    <Stack.Screen
      name="BusMix"
      component={BusMixScreen}
      options={{ title: 'Mix do BUS' }}
    />
  </Stack.Navigator>
);
