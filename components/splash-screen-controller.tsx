import { SplashScreen } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';

SplashScreen.preventAutoHideAsync();

const BRAND_BLUE = '#1E40AF';
/** The branded splash stays at least this long so the tagline can be read. */
const MIN_VISIBLE_MS = 1200;

/**
 * Branded splash: the native splash (white mark on brand blue, app.json) hands over to this
 * identical-looking overlay, which adds the wordmark and tagline below the mark, then fades
 * out once auth has loaded. Android 12+ only allows an icon on the native splash, hence the overlay.
 */
export function SplashScreenController() {
  const { isLoading } = useAuth();
  const [shownAt] = useState(() => Date.now());
  const [done, setDone] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isLoading) return;
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt));
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setDone(true));
    }, wait);
    return () => clearTimeout(timer);
  }, [isLoading, opacity, shownAt]);

  if (done) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.splash, { opacity }]}
      onLayout={() => SplashScreen.hide()}
      accessible
      accessibilityRole="image"
      accessibilityLabel="CohortLive. Learn live. Test real.">
      <Image source={require('@/assets/images/splash-icon.png')} style={styles.mark} />
      <View style={styles.wordmarkSlot}>
        <Image source={require('@/assets/images/brand/wordmark-tagline-on-blue.png')} style={styles.wordmark} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splash: {
    backgroundColor: BRAND_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  // Same size and position as the native splash image (imageWidth 200 in app.json).
  mark: {
    width: 200,
    height: 200,
  },
  wordmarkSlot: {
    position: 'absolute',
    top: '50%',
    marginTop: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  wordmark: {
    width: 185,
    height: 60,
  },
});
