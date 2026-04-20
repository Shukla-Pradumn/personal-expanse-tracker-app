import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Auth } from 'aws-amplify';
import {
  clearUserSession,
  createOrUpdateUserProfile,
  getCurrentUserId,
  getUserProfile,
} from '../services/userProfile';
import AppFooter from '../components/AppFooter';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

const GOLD = Colors.gold;
const BG = Colors.background;
const CARD = Colors.card;
const BORDER = Colors.border;

export default function ProfileScreen({ navigation }) {
  const [name, setName] = React.useState('Loading...');
  const [email, setEmail] = React.useState('Loading...');
  const [phone, setPhone] = React.useState('Not available');
  const [monthlyBudgetInput, setMonthlyBudgetInput] = React.useState('');
  const [savingBudget, setSavingBudget] = React.useState(false);
  const [savingsGoalInput, setSavingsGoalInput] = React.useState('');
  const [savingGoal, setSavingGoal] = React.useState(false);
  const [nameInput, setNameInput] = React.useState('');
  const [savingName, setSavingName] = React.useState(false);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [isEditingBudget, setIsEditingBudget] = React.useState(false);
  const [isEditingGoal, setIsEditingGoal] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        if (!mounted) return;
        const emailValue =
          user?.attributes?.email || user?.username || 'Not available';
        const nameValue = user?.attributes?.name || 'User';
        const phoneValue = user?.attributes?.phone_number || 'Not available';
        setEmail(emailValue);
        setName(nameValue);
        setNameInput(nameValue);
        setPhone(phoneValue);
      } catch {
        if (!mounted) return;
        setName('Not available');
        setEmail('Not available');
        setPhone('Not available');
        return;
      }

      try {
        const profile = await getUserProfile();
        if (!mounted || !profile) return;
        setEmail(profile?.email || 'Not available');
        setName(profile?.name || 'User');
        setNameInput(profile?.name || 'User');
        setPhone(profile?.phone || 'Not available');
        const profileBudget = Number(profile?.monthlyBudget);
        if (Number.isFinite(profileBudget) && profileBudget > 0) {
          setMonthlyBudgetInput(String(profileBudget));
        }
        const profileSavingsGoal = Number(profile?.savingsGoal);
        if (Number.isFinite(profileSavingsGoal) && profileSavingsGoal > 0) {
          setSavingsGoalInput(String(profileSavingsGoal));
        }
      } catch {
        // Keep Cognito values already set above if profile API is not ready yet.
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const onLogout = async () => {
    await Auth.signOut();
    await clearUserSession();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const onBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Dashboard');
  };

  const onSaveName = async () => {
    const trimmed = String(nameInput).trim();
    if (!trimmed) {
      Alert.alert('Invalid name', 'Please enter a valid name.');
      return;
    }

    try {
      setSavingName(true);
      const userId = await getCurrentUserId();
      const existing = await getUserProfile().catch(() => null);
      const fallbackEmail = `${userId}@budget.local`;
      const existingBudget = Number(existing?.monthlyBudget || 0);
      const existingGoal = Number(existing?.savingsGoal || 0);
      const updated = await createOrUpdateUserProfile({
        userId,
        email: existing?.email || email || fallbackEmail,
        name: trimmed,
        phone: existing?.phone || '',
        monthlyBudget: existingBudget > 0 ? existingBudget : undefined,
        savingsGoal: existingGoal > 0 ? existingGoal : undefined,
        setupCompleted: existingBudget > 0 && existingGoal > 0,
      });
      setName(updated?.name || trimmed);
      setNameInput(updated?.name || trimmed);
      setIsEditingName(false);
      Alert.alert('Profile updated', 'Name saved successfully.');
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Unable to update name.');
    } finally {
      setSavingName(false);
    }
  };

  const onSaveBudget = async () => {
    const budgetParsed = Number(
      String(monthlyBudgetInput).replace(/,/g, '').trim(),
    );
    if (!Number.isFinite(budgetParsed) || budgetParsed <= 0) {
      Alert.alert('Invalid budget', 'Please enter a valid monthly budget.');
      return;
    }
    try {
      setSavingBudget(true);
      const userId = await getCurrentUserId();
      const existing = await getUserProfile().catch(() => null);
      const fallbackEmail = `${userId}@budget.local`;
      const existingGoal = Number(existing?.savingsGoal || 0);
      const updated = await createOrUpdateUserProfile({
        userId,
        email: existing?.email || email || fallbackEmail,
        name: existing?.name || name || 'User',
        phone: existing?.phone || '',
        monthlyBudget: budgetParsed,
        savingsGoal: existingGoal > 0 ? existingGoal : undefined,
        setupCompleted: budgetParsed > 0 && existingGoal > 0,
      });
      setMonthlyBudgetInput(String(updated?.monthlyBudget || budgetParsed));
      setIsEditingBudget(false);
      if (existingGoal > 0) {
        Alert.alert('Saved', 'Monthly budget saved successfully.');
      } else {
        Alert.alert(
          'Saved',
          'Monthly budget saved. Please set savings goal to complete setup.',
        );
      }
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Unable to save budget.');
    } finally {
      setSavingBudget(false);
    }
  };

  const onSaveSavingsGoal = async () => {
    const goalParsed = Number(
      String(savingsGoalInput).replace(/,/g, '').trim(),
    );
    if (!Number.isFinite(goalParsed) || goalParsed <= 0) {
      Alert.alert('Invalid goal', 'Please enter a valid savings goal.');
      return;
    }
    try {
      setSavingGoal(true);
      const userId = await getCurrentUserId();
      const existing = await getUserProfile().catch(() => null);
      const fallbackEmail = `${userId}@budget.local`;
      const existingBudget = Number(existing?.monthlyBudget || 0);
      const updated = await createOrUpdateUserProfile({
        userId,
        email: existing?.email || email || fallbackEmail,
        name: existing?.name || name || 'User',
        phone: existing?.phone || '',
        monthlyBudget: existingBudget > 0 ? existingBudget : undefined,
        savingsGoal: goalParsed,
        setupCompleted: existingBudget > 0 && goalParsed > 0,
      });
      setSavingsGoalInput(String(updated?.savingsGoal || goalParsed));
      setIsEditingGoal(false);
      if (existingBudget > 0) {
        Alert.alert('Saved', 'Savings goal saved successfully.');
      } else {
        Alert.alert(
          'Saved',
          'Savings goal saved. Please set monthly budget to complete setup.',
        );
      }
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Unable to save goal.');
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackPress}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.editRow}>
          <Text style={styles.inputLabel}>FULL NAME</Text>
          <TouchableOpacity onPress={() => setIsEditingName(true)}>
            <Text style={styles.editIcon}>🖊️</Text>
          </TouchableOpacity>
        </View>
        {!isEditingName ? (
          <Text style={styles.readOnlyValue}>{name || 'Not set'}</Text>
        ) : (
          <>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter full name"
              placeholderTextColor="#666"
              style={styles.input}
            />
            <TouchableOpacity
              style={[styles.saveBudgetBtn, savingName && styles.disabledBtn]}
              onPress={onSaveName}
              disabled={savingName}
            >
              <Text style={styles.saveBudgetText}>
                {savingName ? 'SAVING...' : 'SAVE NAME'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.row}>
          <Text style={styles.key}>Account</Text>
          <Text style={styles.value}>Cognito User</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.key}>Phone</Text>
          <Text style={styles.value}>{phone}</Text>
        </View>
        <View style={styles.editRow}>
          <Text style={styles.inputLabel}>MONTHLY BUDGET</Text>
          <TouchableOpacity onPress={() => setIsEditingBudget(true)}>
            <Text style={styles.editIcon}>🖊️</Text>
          </TouchableOpacity>
        </View>
        {!isEditingBudget ? (
          <Text style={styles.readOnlyValue}>
            {monthlyBudgetInput ? `₹${monthlyBudgetInput}` : 'Not set'}
          </Text>
        ) : (
          <>
            <TextInput
              value={monthlyBudgetInput}
              onChangeText={setMonthlyBudgetInput}
              keyboardType="numeric"
              placeholder="Enter monthly budget"
              placeholderTextColor="#666"
              style={styles.input}
            />
            <TouchableOpacity
              style={[styles.saveBudgetBtn, savingBudget && styles.disabledBtn]}
              onPress={onSaveBudget}
              disabled={savingBudget}
            >
              <Text style={styles.saveBudgetText}>
                {savingBudget ? 'SAVING...' : 'SAVE BUDGET'}
              </Text>
            </TouchableOpacity>
          </>
        )}
        <View style={styles.editRow}>
          <Text style={styles.inputLabel}>SAVINGS GOAL</Text>
          <TouchableOpacity onPress={() => setIsEditingGoal(true)}>
            <Text style={styles.editIcon}>🖊️</Text>
          </TouchableOpacity>
        </View>
        {!isEditingGoal ? (
          <Text style={styles.readOnlyValue}>
            {savingsGoalInput ? `₹${savingsGoalInput}` : 'Not set'}
          </Text>
        ) : (
          <>
            <TextInput
              value={savingsGoalInput}
              onChangeText={setSavingsGoalInput}
              keyboardType="numeric"
              placeholder="Enter savings target"
              placeholderTextColor="#666"
              style={styles.input}
            />
            <TouchableOpacity
              style={[styles.saveBudgetBtn, savingGoal && styles.disabledBtn]}
              onPress={onSaveSavingsGoal}
              disabled={savingGoal}
            >
              <Text style={styles.saveBudgetText}>
                {savingGoal ? 'SAVING...' : 'SAVE GOAL'}
              </Text>
            </TouchableOpacity>
          </>
        )}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.actionBtnText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <Text style={styles.actionBtnText}>Help & Support</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
      <AppFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingBottom: 88,
  },
  header: { paddingTop: 10, marginBottom: 16 },
  back: { color: GOLD, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  title: { color: '#FFF', fontSize: 30, fontWeight: '700' },
  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 16,
  },
  name: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  email: { color: '#777', marginTop: 4, marginBottom: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  key: { color: '#AAA' },
  value: { color: GOLD, fontWeight: '700' },
  inputLabel: {
    marginTop: 14,
    marginBottom: 8,
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: Typography.weight.bold,
    letterSpacing: 1.5,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editIcon: { fontSize: 16 },
  readOnlyValue: { color: GOLD, fontWeight: '700', marginBottom: 6 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#161616',
    color: '#FFF',
    paddingHorizontal: 14,
  },
  saveBudgetBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBudgetText: { color: '#111', fontWeight: '800', letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { color: '#DDD', fontWeight: '700', fontSize: 12 },
  logoutBtn: {
    marginTop: 20,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6E2F2F',
    backgroundColor: '#2A1818',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: '#FF8C8C', fontWeight: '800', letterSpacing: 1 },
});
