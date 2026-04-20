import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Animated,
  StatusBar,
} from 'react-native';
import { Auth } from 'aws-amplify';

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const isEmailVerified = (value: unknown) =>
    value === true || String(value || '').toLowerCase() === 'true';

  const isFederatedUser = (user: any) => {
    const rawIdentities = user?.attributes?.identities;
    if (Array.isArray(rawIdentities) && rawIdentities.length > 0) {
      return true;
    }
    if (typeof rawIdentities === 'string' && rawIdentities.trim()) {
      try {
        const parsed = JSON.parse(rawIdentities);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return true;
        }
      } catch {
        return true;
      }
    }
    return String(user?.username || '').includes('_');
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const checkExistingSession = async () => {
      try {
        const session = await Auth.currentSession();
        const accessToken = session?.getAccessToken?.();
        const user = await Auth.currentAuthenticatedUser().catch(() => null);
        const emailVerified = isEmailVerified(user?.attributes?.email_verified);
        const federated = isFederatedUser(user);
        if (accessToken && (emailVerified || federated)) {
          navigation.replace('Profile');
        } else {
          await Auth.signOut().catch(() => undefined);
          navigation.replace('Login');
        }
      } catch (_error) {
        // If there is no active session, remain on splash and let user continue.
      }
    };

    checkExistingSession();
  }, []);

  const handleGetStarted = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Dark overlay */}
      <View style={styles.overlay} />

      {/* Centered brand content */}
      <Animated.View
        style={[
          styles.brandContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.logo}>Budget Tracker</Text>
        <Text style={styles.tagline}>Track spending. Build better habits.</Text>
      </Animated.View>

      {/* Bottom CTA */}
      <Animated.View style={[styles.bottomContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        {/* Decorative dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotInactive]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 15, 0, 0.72)',
  },
  brandContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 13,
    color: '#CCCCCC',
    letterSpacing: 2,
    marginTop: 10,
    fontWeight: '300',
  },
  bottomContainer: {
    width: '100%',
    paddingHorizontal: 32,
    paddingBottom: 48,
    alignItems: 'flex-start',
    gap: 16,
  },
  button: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    marginRight: 8,
  },
  dot: {
    borderRadius: 50,
  },
  dotActive: {
    width: 24,
    height: 8,
    backgroundColor: '#F5C518',
  },
  dotInactive: {
    width: 8,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
