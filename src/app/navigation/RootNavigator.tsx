import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AboutScreen } from '@features/about/screens/AboutScreen';
import { BusGroupsScreen } from '@features/busGroups/screens/BusGroupsScreen';
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
  BusGroups: {
    consoleIp: string;
    busNumber: number;
    busName: string;
    linkedBusNumber?: number;
  };
  BusMix: {
    consoleIp: string;
    busNumber: number;
    busName: string;
    linkedBusNumber?: number;
  };
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = (): JSX.Element => (
  <Stack.Navigator
    initialRouteName="ConsoleDiscovery"
    screenOptions={{
      animation: 'slide_from_right',
      contentStyle: { backgroundColor: colors.background.primary },
      headerStyle: { backgroundColor: colors.background.primary },
      headerTintColor: colors.text.primary,
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <Stack.Screen
      name="ConsoleDiscovery"
      component={ConsoleDiscoveryScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="BusSelection"
      component={BusSelectionScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen name="BusGroups" component={BusGroupsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="BusMix" component={BusMixScreen} options={{ headerShown: false }} />
    <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);
