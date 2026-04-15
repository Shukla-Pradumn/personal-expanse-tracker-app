import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Auth } from 'aws-amplify';
import { createOrUpdateUserProfile } from '../services/userProfile';
import { Colors } from '../theme/colors';

const GOLD = Colors.gold;
const BG = Colors.background;
const CARD = Colors.card;
const BORDER = Colors.border;

export default function ConfirmOtpScreen({ navigation, route }) {
  const email = route?.params?.email || '';
  const mode = route?.params?.mode || 'signupConfirm';
  const userId = route?.params?.userId || email;
  const name = route?.params?.name || '';
  const phone = route?.params?.phone || '';
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRef = useRef(null);

  //this is for verify the OTP
  const verifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert(
        'Invalid code',
        'Please enter the 6 digit verification code.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'verifyEmail') {
        await (Auth as any).verifyCurrentUserAttributeSubmit(
          'email',
          otp.trim(),
        );
        const refreshedUser = await (Auth as any).currentAuthenticatedUser({
          bypassCache: true,
        });
        const verified =
          refreshedUser?.attributes?.email_verified === true ||
          String(
            refreshedUser?.attributes?.email_verified || '',
          ).toLowerCase() === 'true';
        if (verified) {
          Alert.alert('Verified', 'Email verified successfully.');
          navigation.reset({ index: 0, routes: [{ name: 'Profile' }] });
        } else {
          Alert.alert(
            'Verification pending',
            'Email is still not verified. Please try resend OTP.',
          );
        }
      } else {
        const result = await Auth.confirmSignUp(email, otp.trim());
        if (result === 'SUCCESS') {
          if (email && name) {
            createOrUpdateUserProfile({
              userId,
              email,
              name,
              phone,
            })
              .then(() => {
                console.log('OTP verification profile synced for =>', userId);
              })
              .catch((syncError: any) => {
                console.log(
                  'Skipping profile sync after OTP =>',
                  syncError?.message || 'Unknown error',
                );
              });
          }
          Alert.alert('Verified', 'Your account is verified. Please sign in.');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } else {
          Alert.alert('Verification pending', 'Please try again.');
        }
      }
    } catch (error) {
      const message = String(error?.message || '');
      const isAlreadyConfirmed =
        error?.name === 'NotAuthorizedException' &&
        /already confirmed|current status is confirmed/i.test(message);

      if (isAlreadyConfirmed) {
        if (mode === 'signupConfirm') {
          Alert.alert(
            'Account already confirmed',
            'Now verify your email from login using OTP.',
          );
        } else {
          Alert.alert(
            'Already verified',
            'Your account is already confirmed. Please sign in.',
          );
        }
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      Alert.alert(
        'Verification failed',
        error?.message || 'Invalid or expired code.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    setIsResending(true);
    try {
      if (mode === 'verifyEmail') {
        await (Auth as any).verifyCurrentUserAttribute?.('email');
      } else {
        await Auth.resendSignUp(email);
      }
      Alert.alert('Code sent', `A new OTP has been sent to ${email}.`);
      inputRef.current?.focus();
    } catch (error) {
      Alert.alert(
        'Unable to resend',
        error?.message || 'Please try again later.',
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgLine} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.appName}>BUDGET TRACKER</Text>
          <View style={styles.accentLine} />
          <Text style={styles.welcomeText}>Verify OTP</Text>
          <Text style={styles.subText}>
            {mode === 'verifyEmail'
              ? `Verify your email address: ${email}`
              : `Enter the code sent to ${email}`}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>ONE TIME PASSWORD</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>#</Text>
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter 6 digit code"
              placeholderTextColor="#555"
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={verifyOtp}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'VERIFYING...' : 'VERIFY ACCOUNT'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              isResending && styles.buttonDisabled,
            ]}
            onPress={resendCode}
            activeOpacity={0.85}
            disabled={isResending}
          >
            <Text style={styles.secondaryButtonText}>
              {isResending ? 'SENDING...' : 'RESEND OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  inner: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  bgCircle1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(245,197,24,0.05)',
    top: -60,
    right: -70,
  },
  bgCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(245,197,24,0.04)',
    bottom: 120,
    left: -50,
  },
  bgLine: {
    position: 'absolute',
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(245,197,24,0.08)',
    left: 36,
    top: '15%',
  },
  header: { marginBottom: 24 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backArrow: {
    color: GOLD,
    fontSize: 28,
    lineHeight: 28,
    marginRight: 4,
    marginTop: -2,
  },
  backText: { color: GOLD, fontSize: 13, letterSpacing: 1, fontWeight: '600' },
  appName: {
    fontSize: 11,
    letterSpacing: 6,
    color: GOLD,
    fontWeight: '700',
    marginBottom: 10,
  },
  accentLine: { width: 40, height: 2, backgroundColor: GOLD, marginBottom: 14 },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.4,
  },
  subText: { fontSize: 13, color: '#777', marginTop: 6, letterSpacing: 0.3 },
  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#666',
    marginBottom: 7,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 16,
  },
  inputIcon: { fontSize: 14, marginRight: 10, color: '#555' },
  input: { flex: 1, color: '#FFF', fontSize: 14, letterSpacing: 3 },
  primaryButton: {
    backgroundColor: GOLD,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 2,
  },
  secondaryButton: {
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#161616',
  },
  secondaryButtonText: {
    color: GOLD,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  buttonDisabled: { opacity: 0.5 },
});
