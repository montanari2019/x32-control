import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppState, StyleSheet } from 'react-native';
import KeepAwake from 'react-native-keep-awake';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { darkTheme } from '@shared/theme/darkTheme';
import { ModalProvider } from '@shared/components/Modal';
import { colors } from '@shared/theme/colors';
import { syncI18nWithDeviceLocale } from '@shared/i18n';
import { AppSplashScreen } from './components/AppSplashScreen';
import { RootNavigator } from './navigation/RootNavigator';

const App = (): JSX.Element => {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const handleSplashFinish = useCallback(() => {
    setIsSplashVisible(false);
  }, []);

  useEffect(() => {
    KeepAwake.activate();

    return () => {
      KeepAwake.deactivate();
    };
  }, []);

  useEffect(() => {
    syncI18nWithDeviceLocale();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        syncI18nWithDeviceLocale();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
        <NavigationContainer theme={darkTheme}>
          <ModalProvider>
            <RootNavigator />
            {isSplashVisible ? <AppSplashScreen onFinish={handleSplashFinish} /> : null}
          </ModalProvider>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
});

export default App;
