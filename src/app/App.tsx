import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import KeepAwake from 'react-native-keep-awake';
import { darkTheme } from '@shared/theme/darkTheme';
import { ModalProvider } from '@shared/components/Modal';
import { RootNavigator } from './navigation/RootNavigator';

const App = (): JSX.Element => (
  <NavigationContainer theme={darkTheme}>
    <ModalProvider>
      <KeepAwake />
      <RootNavigator />
    </ModalProvider>
  </NavigationContainer>
);

export default App;
