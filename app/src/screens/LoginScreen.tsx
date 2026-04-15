import React, { useState, useRef, useEffect } from 'react';
import { Auth } from 'aws-amplify';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { createOrUpdateUserProfile } from '../services/userProfile';
import { saveAuthToken } from '../services/authSession';
import { Colors } from '../theme/colors';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const cardAnim = useRef(new Animated.Value(60)).current;

  const isEmailVerified = (value: unknown) =>
    value === true || String(value || '').toLowerCase() === 'true';

  const login = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }

    try {
      const user = await Auth.signIn(email, password);
      console.log('user=============>', user);
      const idToken =
        user?.signInUserSession?.idToken?.jwtToken ||
        user?.signInUserSession?.idToken?.getJwtToken?.() ||
        '';
      const hasValidSession = Boolean(
        user?.signInUserSession?.idToken?.jwtToken &&
          user?.signInUserSession?.accessToken?.jwtToken,
      );
      const verified = isEmailVerified(user?.attributes?.email_verified);

      if (user?.challengeName === 'USER_NOT_CONFIRMED') {
        Alert.alert(
          'Verify your account',
          'Your account is not verified yet. Please enter OTP to continue.',
        );
        navigation.navigate('ConfirmOtp', { email, mode: 'signupConfirm' });
      } else if (!verified) {
        await (Auth as any).verifyCurrentUserAttribute?.('email').catch(
          () => undefined,
        );
        Alert.alert(
          'Email verification required',
          'Please verify your email with OTP before signing in.',
        );
        navigation.navigate('ConfirmOtp', {
          email: email.trim(),
          mode: 'verifyEmail',
        });
      } else if (hasValidSession) {
        if (idToken) {
          await saveAuthToken(idToken);
        }
        console.log(
          'Login success with valid session. Redirecting to profile.',
        );
        const resolvedUserId =
          user?.attributes?.sub || user?.username || user?.attributes?.email;
        const resolvedEmail = user?.attributes?.email || email.trim();
        const resolvedName = user?.attributes?.name || 'User';
        const resolvedPhone = user?.attributes?.phone_number || '';
        navigation.reset({ index: 0, routes: [{ name: 'Profile' }] });
        createOrUpdateUserProfile({
          userId: resolvedUserId,
          email: resolvedEmail,
          name: resolvedName,
          phone: resolvedPhone,
        }).catch(error => {
          console.log('Profile sync failed after navigation =>', error);
        });
      } else {
        console.log('Unexpected login payload =>', user);
        Alert.alert(
          'Action required',
          'Additional sign-in challenge required.',
        );
      }
    } catch (error) {
      if (error?.name === 'UserNotConfirmedException') {
        Alert.alert(
          'Verify your account',
          'Your account is not verified yet. Please enter OTP to continue.',
        );
        navigation.navigate('ConfirmOtp', { email, mode: 'signupConfirm' });
      } else {
        Alert.alert('Login failed', error?.message || 'Unable to sign in.');
      }
    }
  };

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(cardAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        {/* Background geometric accents */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <View style={styles.bgLine} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inner}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.appName}>BUDGET TRACKER</Text>
            <View style={styles.accentLine} />
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.subText}>Sign in to continue your journey</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: cardAnim }],
              },
            ]}
          >
            {/* Email Field */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'email' && styles.inputFocused,
                ]}
              >
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  placeholder="you@example.com"
                  placeholderTextColor="#555"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>PASSWORD</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'password' && styles.inputFocused,
                ]}
              >
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#555"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                >
                  <Text style={styles.eyeIcon}>
                    {passwordVisible ? '🙈' : '👁'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotWrapper}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => login()}
              activeOpacity={0.85}
            >
              <Text style={styles.loginButtonText}>SIGN IN</Text>
              <View style={styles.buttonArrow}>
                <Text style={styles.buttonArrowText}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn}>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn}>
                <Text style={styles.socialIcon}>f</Text>
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.footerText}>New to Budget Tracker? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Create Account</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const GOLD = Colors.gold;
const BG = Colors.background;
const CARD = Colors.card;
const BORDER = Colors.border;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* Background decorations */
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(245,197,24,0.05)',
    top: -80,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245,197,24,0.04)',
    bottom: 100,
    left: -60,
  },
  bgLine: {
    position: 'absolute',
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(245,197,24,0.08)',
    left: 40,
    top: '20%',
  },

  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  /* Header */
  header: {
    marginBottom: 32,
  },
  appName: {
    fontSize: 13,
    letterSpacing: 6,
    color: GOLD,
    fontWeight: '700',
    marginBottom: 12,
  },
  accentLine: {
    width: 40,
    height: 2,
    backgroundColor: GOLD,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subText: {
    fontSize: 14,
    color: '#777',
    marginTop: 6,
    letterSpacing: 0.3,
  },

  /* Card */
  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },

  /* Fields */
  fieldWrapper: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#999',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    height: 52,
  },
  inputFocused: {
    borderColor: GOLD,
    backgroundColor: '#1A1800',
  },
  inputIcon: {
    fontSize: 15,
    marginRight: 10,
    color: '#555',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  eyeIcon: {
    fontSize: 16,
    paddingLeft: 8,
  },

  /* Forgot */
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -6,
  },
  forgotText: {
    color: GOLD,
    fontSize: 12,
    letterSpacing: 0.5,
  },

  /* Login Button */
  loginButton: {
    backgroundColor: GOLD,
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  loginButtonText: {
    color: '#111111',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 3,
  },
  buttonArrow: {
    position: 'absolute',
    right: 18,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonArrowText: {
    color: '#111',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  dividerText: {
    color: '#444',
    fontSize: 11,
    marginHorizontal: 12,
    letterSpacing: 2,
  },

  /* Social */
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    height: 46,
    gap: 8,
    backgroundColor: '#161616',
  },
  socialIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  socialText: {
    color: '#AAA',
    fontSize: 13,
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    paddingBottom: 16,
  },
  footerText: {
    color: '#555',
    fontSize: 14,
  },
  signupLink: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
