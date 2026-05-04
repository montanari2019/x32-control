import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { darkTheme } from '@shared/theme/darkTheme';
import { RootNavigator } from './navigation/RootNavigator';

const App = (): JSX.Element => (
  <NavigationContainer theme={darkTheme}>
    <RootNavigator />
  </NavigationContainer>
);

export default App;
