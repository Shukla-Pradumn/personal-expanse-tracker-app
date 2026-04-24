import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Auth } from 'aws-amplify';
import AppFooter from '../components/AppFooter';
import { Colors } from '../theme/colors';
import {
  getGroupBalances,
  getGroupExpenses,
  getGroupMembers,
  inviteGroupMember,
} from '../services/groupService';
import type {
  ExpenseItem,
  GroupBalanceResponse,
  GroupMemberItem,
} from '../types/models';

export default function GroupDetailsScreen({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const group = route?.params?.group;
  const groupId = String(group?.groupId || '');
  const [members, setMembers] = React.useState<GroupMemberItem[]>([]);
  const [expenses, setExpenses] = React.useState<ExpenseItem[]>([]);
  const [balances, setBalances] = React.useState<GroupBalanceResponse | null>(
    null,
  );
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [currentIdentityKeys, setCurrentIdentityKeys] = React.useState<
    string[]
  >([]);

  const load = React.useCallback(async () => {
    if (!groupId) return;
    const [membersData, expensesData, balancesData] = await Promise.all([
      getGroupMembers(groupId).catch(() => []),
      getGroupExpenses(groupId).catch(() => []),
      getGroupBalances(groupId).catch(() => null),
    ]);
    setMembers(membersData);
    setExpenses(expensesData);
    setBalances(balancesData);
  }, [groupId]);
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  React.useEffect(() => {
    let mounted = true;
    Auth.currentAuthenticatedUser()
      .then((user) => {
        if (!mounted) return;
        const keys = [
          user?.attributes?.sub,
          user?.attributes?.email,
          user?.attributes?.name,
          user?.username,
        ]
          .map((value) =>
            String(value || '')
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean);
        setCurrentIdentityKeys(Array.from(new Set(keys)));
      })
      .catch(() => {
        if (!mounted) return;
        setCurrentIdentityKeys([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const normalize = (value: unknown) =>
    String(value || '')
      .trim()
      .toLowerCase();
  const balanceEntries = Array.isArray(balances?.net) ? balances.net : [];

  const balanceKeySet = new Set(balanceEntries.map((entry) => normalize(entry.member)));
  const directBalanceKey =
    currentIdentityKeys.find((key) => balanceKeySet.has(normalize(key))) || '';
  const matchedMember = members.find((member) => {
    const keys = [member.userId, member.email, member.name]
      .map((value) => normalize(value))
      .filter(Boolean);
    return keys.some((key) => currentIdentityKeys.includes(key));
  });
  const memberBalanceKey =
    (matchedMember &&
      [matchedMember.name, matchedMember.email, matchedMember.userId]
        .map((value) => normalize(value))
        .find((key) => key && balanceKeySet.has(key))) ||
    '';
  const currentBalanceKey =
    normalize(balances?.currentMemberKey || '') || directBalanceKey || memberBalanceKey;
  const currentUserNetAmount =
    balanceEntries.find((entry) => normalize(entry.member) === currentBalanceKey)
      ?.amount || 0;

  const shouldShowPayNowForRow = (rowMember: string, rowAmount: number) => {
    if (!currentBalanceKey) return false;
    if (normalize(rowMember) === currentBalanceKey) return false;
    if (Number(currentUserNetAmount) === 0 || Number(rowAmount) === 0) return false;
    // Generic rule: show for opposite-sign counterparties only.
    return (
      (Number(currentUserNetAmount) < 0 && Number(rowAmount) > 0) ||
      (Number(currentUserNetAmount) > 0 && Number(rowAmount) < 0)
    );
  };
  const singlePayAmount =
    Number(currentUserNetAmount) < 0
      ? Number(Math.abs(currentUserNetAmount).toFixed(2))
      : 0;
  const payTargets = balanceEntries
    .filter((entry) => Number(entry.amount) > 0)
    .map((entry) => ({
      member: entry.member,
      amount: Number(entry.amount.toFixed(2)),
    }));

  const onInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    await inviteGroupMember(groupId, email);
    setInviteEmail('');
    load();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{group?.name || 'Group'}</Text>
          <Text style={styles.groupId}>{groupId}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Invite Member</Text>
          <TextInput
            value={inviteEmail}
            onChangeText={setInviteEmail}
            placeholder="member@email.com"
            placeholderTextColor="#666"
            style={styles.input}
          />
          <TouchableOpacity style={styles.btn} onPress={onInvite}>
            <Text style={styles.btnText}>SEND INVITE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Balances</Text>
          <Text style={styles.meta}>
            Total expenses: ₹{balances?.summary?.totalExpenses || 0}
          </Text>
          <Text style={styles.meta}>
            You owe: ₹{balances?.summary?.youOwe || 0}
          </Text>
          <Text style={styles.meta}>
            You are owed: ₹{balances?.summary?.youAreOwed || 0}
          </Text>
          <Text style={styles.net}>Net: ₹{balances?.summary?.net || 0}</Text>
          {singlePayAmount > 0 ? (
            <TouchableOpacity
              style={styles.singlePayBtn}
              onPress={() => {
                console.log('Pay now clicked =>', {
                  groupId,
                  amountToPay: singlePayAmount,
                  targets: payTargets,
                  direction: 'you_pay_them',
                });
              }}
            >
              <Text style={styles.singlePayBtnText}>
                Pay Now ₹{singlePayAmount}
              </Text>
            </TouchableOpacity>
          ) : null}
          {balances?.net?.map((item) => {
            return (
              <View key={item.member} style={styles.balanceRow}>
                <Text style={styles.memberMeta}>
                  {item.member}: ₹{item.amount}
                </Text>
                {/* Per-row actions removed; using one consolidated pay action */}
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>Members</Text>
            <Text style={styles.meta}>{members.length}</Text>
          </View>
          {members.map((member) => (
            <Text key={member.membershipId} style={styles.memberMeta}>
              {member.name || member.email} • {member.status}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>Group Expenses</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddGroupExpense', { group })}
            >
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          </View>
          {expenses.length ? (
            expenses.map((item) => (
              <View
                key={item.id || (item as any).expenseId}
                style={styles.expenseRow}
              >
                <Text style={styles.expenseTitle}>{item.title}</Text>
                <Text style={styles.expenseAmount}>₹{item.amount}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.meta}>No group expenses yet.</Text>
          )}
        </View>
      </ScrollView>
      <AppFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  scroll: { paddingBottom: 120 },
  header: { paddingTop: 10, marginBottom: 12 },
  back: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  title: { color: '#FFF', fontSize: 28, fontWeight: '700' },
  groupId: { color: '#777', marginTop: 4 },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.footer,
    color: '#FFF',
    paddingHorizontal: 12,
  },
  btn: {
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#111', fontWeight: '800' },
  meta: { color: '#BBB' },
  net: { color: Colors.gold, fontWeight: '700' },
  memberMeta: { color: '#DDD', fontSize: 13 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  payNowBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.footer,
  },
  payNowBtnText: { color: Colors.gold, fontSize: 12, fontWeight: '700' },
  singlePayBtn: {
    marginTop: 8,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singlePayBtnText: { color: '#111', fontWeight: '800', letterSpacing: 0.8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.footer,
  },
  addBtnText: { color: Colors.gold, fontWeight: '700' },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
  },
  expenseTitle: { color: '#FFF' },
  expenseAmount: { color: '#FF8C8C', fontWeight: '700' },
});
