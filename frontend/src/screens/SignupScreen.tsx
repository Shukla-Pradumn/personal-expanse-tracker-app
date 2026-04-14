import React, { useState, useRef, useEffect } from 'react';
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
  ScrollView,
  Alert,
  KeyboardTypeOptions,
} from 'react-native';
import { Auth } from 'aws-amplify';
import { createOrUpdateUserProfile } from '../services/userProfile';
import { saveAuthToken } from '../services/authSession';
import { Colors } from '../theme/colors';

const GOLD = Colors.gold;
const BG = Colors.background;
const CARD = Colors.card;
const BORDER = Colors.border;

// ✅ Field is outside the component — prevents keyboard dismiss on re-render
interface FieldProps {
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  secure?: boolean;
  showToggle?: boolean;
  visible?: boolean;
  onToggle?: () => void;
  keyboardType?: KeyboardTypeOptions;
  field: string;
  focusedField: string | null;
  setFocusedField: (field: string | null) => void;
}

const Field = ({
  label,
  icon,
  placeholder,
  value,
  onChange,
  secure,
  showToggle,
  visible,
  onToggle,
  keyboardType = 'default',
  field,
  focusedField,
  setFocusedField,
}: FieldProps) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.label}>{label}</Text>
    <View
      style={[
        styles.inputContainer,
        focusedField === field && styles.inputFocused,
      ]}
    >
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#555"
        style={styles.input}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure && !visible}
        keyboardType={keyboardType}
        autoCapitalize={field === 'name' ? 'words' : 'none'}
        onFocus={() => setFocusedField(field)}
        onBlur={() => setFocusedField(null)}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggle}>
          <Text style={styles.eyeIcon}>{visible ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const cardAnim = useRef(new Animated.Value(60)).current;

  const signup = async () => {
    if (!email || !password || !confirmPassword || !name || !phone) {
      Alert.alert('Missing fields', 'Please fill all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(
        'Password mismatch',
        'Password and confirm password must match.',
      );
      return;
    }

    const normalizedPhone = phone.trim().replace(/\s+/g, '');
    if (!/^\+\d{8,15}$/.test(normalizedPhone)) {
      Alert.alert(
        'Invalid phone',
        'Enter phone in international format, e.g. +919876543210',
      );
      return;
    }

    setIsLoading(true);
    try {
      const user = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          name,
          phone_number: normalizedPhone,
        },
      });

      if (user?.userConfirmed) {
        const resolvedUserId =
          user?.userSub || email;
        await createOrUpdateUserProfile({
          userId: resolvedUserId,
          email,
          name,
          phone: normalizedPhone,
        });
        const signedIn = await Auth.signIn(email, password).catch(() => null);
        const idToken =
          signedIn?.signInUserSession?.idToken?.jwtToken ||
          signedIn?.signInUserSession?.idToken?.getJwtToken?.() ||
          '';
        if (idToken) {
          await saveAuthToken(idToken);
        }
        Alert.alert('Account ready', 'Now complete your profile setup.');
        navigation.reset({ index: 0, routes: [{ name: 'Profile' }] });
      } else {
        const resolvedUserId = user?.userSub || email;
        navigation.navigate('ConfirmOtp', {
          userId: resolvedUserId,
          email,
          name,
          phone: normalizedPhone,
        });
      }
    } catch (error) {
      const errorName = error?.name;
      if (errorName === 'UsernameExistsException') {
        try {
          await Auth.resendSignUp(email);
        } catch (_resendError) {
          // If resend fails, continue to OTP screen so user can try existing code.
        }
        Alert.alert(
          'Account already exists',
          'This email is already registered but not verified. Please enter OTP to continue.',
        );
        navigation.navigate('ConfirmOtp', {
          userId: email,
          email,
          name,
          phone: normalizedPhone,
        });
      } else {
        Alert.alert(
          'Signup failed',
          error?.message || 'Unable to create account.',
        );
      }
    } finally {
      setIsLoading(false);
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

  const getStrength = () => {
    if (password.length === 0)
      return { level: 0, label: '', color: 'transparent' };
    if (password.length < 6)
      return { level: 1, label: 'Weak', color: '#E74C3C' };
    if (password.length < 10)
      return { level: 2, label: 'Fair', color: '#F39C12' };
    return { level: 3, label: 'Strong', color: '#2ECC71' };
  };

  const strength = getStrength();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Background decorations */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgLine} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backArrow}>‹</Text>
              <Text style={styles.backText}>Sign In</Text>
            </TouchableOpacity>

            <Text style={styles.appName}>BUDGET TRACKER</Text>
            <View style={styles.accentLine} />
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subText}>
              Join us and explore the experience
            </Text>

            <View style={styles.stepRow}>
              {[1, 2, 3].map(s => (
                <View
                  key={s}
                  style={[styles.stepDot, s === 1 && styles.stepDotActive]}
                />
              ))}
            </View>
          </Animated.View>

          {/* Card */}
          <Animated.View
            style={[
              styles.card,
              { opacity: fadeAnim, transform: [{ translateY: cardAnim }] },
            ]}
          >
            <Field
              label="FULL NAME"
              icon="👤"
              placeholder="John Doe"
              value={name}
              onChange={setName}
              field="name"
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />
            <Field
              label="EMAIL ADDRESS"
              icon="✉"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              keyboardType="email-address"
              field="email"
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />
            <Field
              label="PHONE NUMBER"
              icon="📱"
              placeholder="+91XXXXXXXXXX"
              value={phone}
              onChange={setPhone}
              keyboardType="phone-pad"
              field="phone"
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />
            <Field
              label="PASSWORD"
              icon="🔒"
              placeholder="Create a strong password"
              value={password}
              onChange={setPassword}
              secure
              showToggle
              visible={passwordVisible}
              onToggle={() => setPasswordVisible(!passwordVisible)}
              field="password"
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />

            {/* Password strength */}
            {password.length > 0 && (
              <View style={styles.strengthWrapper}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            i <= strength.level ? strength.color : BORDER,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}

            <Field
              label="CONFIRM PASSWORD"
              icon="🛡"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              secure
              showToggle
              visible={confirmVisible}
              onToggle={() => setConfirmVisible(!confirmVisible)}
              field="confirm"
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />

            {/* Password match hint */}
            {confirmPassword.length > 0 && (
              <Text
                style={[
                  styles.matchHint,
                  {
                    color: password === confirmPassword ? '#2ECC71' : '#E74C3C',
                  },
                ]}
              >
                {password === confirmPassword
                  ? '✓ Passwords match'
                  : '✗ Passwords do not match'}
              </Text>
            )}

            {/* Terms checkbox */}
            {/* <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity> */}

            {/* Create Account Button */}
            <TouchableOpacity
              style={[
                styles.signupButton,
                isLoading && styles.signupButtonDisabled,
              ]}
              onPress={() => !isLoading && signup()}
              activeOpacity={!isLoading ? 0.85 : 1}
            >
              <Text style={styles.signupButtonText}>
                {isLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
              </Text>
              <View style={styles.buttonArrow}>
                <Text style={styles.buttonArrowText}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social */}
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
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

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

  scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },

  header: { marginBottom: 28 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
  stepRow: { flexDirection: 'row', gap: 6, marginTop: 16 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BORDER },
  stepDotActive: { width: 24, backgroundColor: GOLD },

  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },

  fieldWrapper: { marginBottom: 16 },
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
  },
  inputFocused: { borderColor: GOLD, backgroundColor: '#1A1800' },
  inputIcon: { fontSize: 14, marginRight: 10, color: '#555' },
  input: { flex: 1, color: '#FFF', fontSize: 14, letterSpacing: 0.3 },
  eyeIcon: { fontSize: 15, paddingLeft: 8 },

  strengthWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -8,
    marginBottom: 14,
  },
  strengthBars: { flexDirection: 'row', gap: 5, flex: 1 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1 },

  matchHint: {
    fontSize: 11,
    marginTop: -8,
    marginBottom: 12,
    letterSpacing: 0.5,
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 22,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: GOLD, borderColor: GOLD },
  checkmark: { color: '#111', fontSize: 12, fontWeight: '800' },
  termsText: { flex: 1, color: '#777', fontSize: 12, lineHeight: 18 },
  termsLink: { color: GOLD, fontWeight: '600' },

  signupButton: {
    backgroundColor: GOLD,
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  signupButtonDisabled: { opacity: 0.45 },
  signupButtonText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 3,
  },
  buttonArrow: {
    position: 'absolute',
    right: 16,
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

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: {
    color: '#444',
    fontSize: 9,
    marginHorizontal: 10,
    letterSpacing: 2,
  },

  socialRow: { flexDirection: 'row', gap: 12 },
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
  socialIcon: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  socialText: { color: '#AAA', fontSize: 13 },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: { color: '#555', fontSize: 14 },
  loginLink: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
