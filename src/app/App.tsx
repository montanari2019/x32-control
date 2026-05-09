import React, { useCallback, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import KeepAwake from 'react-native-keep-awake';
import { darkTheme } from '@shared/theme/darkTheme';
import { ModalProvider } from '@shared/components/Modal';
import { AppSplashScreen } from './components/AppSplashScreen';
import { RootNavigator } from './navigation/RootNavigator';

const App = (): JSX.Element => {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const handleSplashFinish = useCallback(() => {
    setIsSplashVisible(false);
  }, []);

  return (
    <NavigationContainer theme={darkTheme}>
      <ModalProvider>
        <KeepAwake />
        <RootNavigator />
        {isSplashVisible ? <AppSplashScreen onFinish={handleSplashFinish} /> : null}
      </ModalProvider>
    </NavigationContainer>
  );
};

export default App;
