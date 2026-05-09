import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { Lotties } from '@assets';
import { colors } from '@shared/theme/colors';

const SPLASH_DURATION_MS = 1500;
const SPLASH_FADE_DURATION_MS = 220;

type AppSplashScreenProps = {
  onFinish: () => void;
};

export const AppSplashScreen = ({ onFinish }: AppSplashScreenProps): JSX.Element => {
  const opacity = useRef(new Animated.Value(1)).current;
  const hasFinishedRef = useRef(false);

  const finish = useCallback(() => {
    if (hasFinishedRef.current) {
      return;
    }

    hasFinishedRef.current = true;
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: SPLASH_FADE_DURATION_MS,
        useNativeDriver: true,
      }).start();
    }, SPLASH_DURATION_MS - SPLASH_FADE_DURATION_MS);

    const finishTimer = setTimeout(() => {
      finish();
    }, SPLASH_DURATION_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
      opacity.stopAnimation();
    };
  }, [finish, opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.content}>
        <Text style={styles.title}>TaciMix</Text>
        <LottieView autoPlay loop source={Lotties.SoundBarsAnimation} style={styles.lottie} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.accent.primary,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 20,
  },
  lottie: {
    backgroundColor: 'transparent',
    height: 132,
    width: 132,
  },
});
