import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Auth } from 'aws-amplify';
import AppFooter from '../components/AppFooter';
import { Colors } from '../theme/colors';
import {
  deleteGroupExpense,
  getPaymentStatus,
  getGroupBalances,
  getGroupExpenses,
  getGroupMembers,
  initiatePayment,
  inviteGroupMember,
  verifyPaymentUsers,
} from '../services/groupService';
import type {
  ExpenseItem,
  GroupBalanceResponse,
  GroupMemberItem,
  PaymentVerificationData,
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
  const [paymentModalVisible, setPaymentModalVisible] = React.useState(false);
  const [selectedSettlement, setSelectedSettlement] = React.useState<{
    member: string;
    amount: number;
    direction: 'you_pay_them' | 'they_pay_you';
  } | null>(null);
  const [verification, setVerification] =
    React.useState<PaymentVerificationData | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isInitiatingPayment, setIsInitiatingPayment] = React.useState(false);
  const [paymentStatus, setPaymentStatus] = React.useState('pending');
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

  const balanceKeySet = new Set(
    balanceEntries.map((entry) => normalize(entry.member)),
  );
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
    normalize(balances?.currentMemberKey || '') ||
    directBalanceKey ||
    memberBalanceKey;
  const currentUserNetAmount =
    balanceEntries.find(
      (entry) => normalize(entry.member) === currentBalanceKey,
    )?.amount || 0;
  const roundedCurrentNet = Number(
    Number(currentUserNetAmount || 0).toFixed(2),
  );
  const settlementRows = balanceEntries
    .filter((entry) => normalize(entry.member) !== currentBalanceKey)
    .filter((entry) => {
      const amount = Number(entry.amount || 0);
      if (!roundedCurrentNet || !amount) return false;
      return (
        (roundedCurrentNet < 0 && amount > 0) ||
        (roundedCurrentNet > 0 && amount < 0)
      );
    })
    .map((entry) => {
      const amount = Math.min(
        Math.abs(roundedCurrentNet),
        Math.abs(Number(entry.amount || 0)),
      );
      const direction: 'you_pay_them' | 'they_pay_you' =
        roundedCurrentNet < 0 ? 'you_pay_them' : 'they_pay_you';
      return {
        member: entry.member,
        amount: Number(amount.toFixed(2)),
        direction,
      };
    });

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

  React.useEffect(() => {
    if (!verification?.fromUserId || !verification?.toUserId) return;
    if (!paymentModalVisible) return;
    let active = true;
    const poll = async () => {
      try {
        const latest = await getPaymentStatus(
          verification.fromUserId,
          verification.toUserId,
        );
        if (!active) return;
        const normalized = String(latest?.status || 'pending')
          .trim()
          .toLowerCase();
        setPaymentStatus(normalized);
        if (normalized === 'success' || normalized === 'completed') {
          Alert.alert('Settled', 'Payment success and group settlement updated.');
          setPaymentModalVisible(false);
          load();
          return;
        }
        if (normalized === 'failed') {
          Alert.alert('Payment failed', 'Payment was not completed.');
          return;
        }
      } catch {
        // keep polling quietly
      }
      if (active) {
        setTimeout(poll, 3000);
      }
    };
    poll();
    return () => {
      active = false;
    };
  }, [verification, paymentModalVisible, load]);

  const openPayNowModal = async (row: {
    member: string;
    amount: number;
    direction: 'you_pay_them' | 'they_pay_you';
  }) => {
    if (row.direction !== 'you_pay_them') {
      Alert.alert(
        'Info',
        'Payment can only be initiated when you owe someone.',
      );
      return;
    }
    const matchedMember = members.find((member) => {
      const aliases = [member.name, member.email, member.userId]
        .map((value) => normalize(value))
        .filter(Boolean);
      return aliases.includes(normalize(row.member));
    });
    console.log('matchedMember==================', matchedMember);
    const toEmail = String(matchedMember?.email || '')
      .trim()
      .toLowerCase();
    if (!toEmail) {
      Alert.alert('Unable to verify', 'Target member email is missing.');
      return;
    }

    setSelectedSettlement(row);
    setPaymentModalVisible(true);
    setPaymentStatus('pending');
    setVerification(null);
    setIsVerifying(true);
    try {
      const result = await verifyPaymentUsers(toEmail);
      console.log('result==================', result);
      setVerification(result || null);
      setPaymentStatus(result?.isVerified ? 'verified' : 'pending');
      if (result?.fromUserId && result?.toUserId) {
        const latest = await getPaymentStatus(
          result.fromUserId,
          result.toUserId,
        );
        if (latest?.status) {
          setPaymentStatus(String(latest.status));
        }
      }
    } catch (error: any) {
      Alert.alert(
        'Verification failed',
        error?.message || 'Unable to verify users.',
      );
      setPaymentModalVisible(false);
      setSelectedSettlement(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const onInitiatePayment = async () => {
    if (!verification || !selectedSettlement) return;
    setIsInitiatingPayment(true);
    const currentMemberLabel =
      String(
        matchedMember?.name || matchedMember?.email || matchedMember?.userId || '',
      ).trim() || 'You';
    try {
      await initiatePayment({
        fromUserId: verification.fromUserId,
        toUserId: verification.toUserId,
        amount: Number(selectedSettlement.amount || 0),
        note: `Settlement for group ${group?.name || groupId}`,
        groupId,
        fromMember: currentMemberLabel,
        toMember: selectedSettlement.member,
      });
      setPaymentStatus('initiated');
    } catch (error: any) {
      Alert.alert(
        'Payment initiation failed',
        error?.message || 'Unable to initiate payment.',
      );
    } finally {
      setIsInitiatingPayment(false);
    }
  };

  const onDeleteExpense = (expense: ExpenseItem & { expenseId?: string }) => {
    const expenseId = String(expense.id || expense.expenseId || '').trim();
    if (!expenseId) {
      Alert.alert('Delete failed', 'Expense id is missing.');
      return;
    }
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroupExpense(groupId, expenseId);
              await load();
              Alert.alert('Deleted', 'Expense deleted successfully.');
            } catch (error: any) {
              Alert.alert(
                'Delete failed',
                error?.message || 'Could not delete expense. Please try again.',
              );
            }
          },
        },
      ],
    );
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
            Total expenses: ₹
            {Number(balances?.summary?.totalExpenses || 0).toFixed(2)}
          </Text>
          <View style={styles.summaryChips}>
            <View style={styles.chipWarn}>
              <Text style={styles.chipWarnText}>
                You owe ₹{Number(balances?.summary?.youOwe || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.chipGood}>
              <Text style={styles.chipGoodText}>
                You are owed ₹
                {Number(balances?.summary?.youAreOwed || 0).toFixed(2)}
              </Text>
            </View>
          </View>
          <Text style={styles.net}>
            Net: ₹{Number(balances?.summary?.net || 0).toFixed(2)}
          </Text>

          <Text style={styles.subSectionTitle}>Settlement Actions</Text>
          {settlementRows.length ? (
            settlementRows.map((row) => (
              <View
                key={`${row.member}-${row.direction}`}
                style={styles.balanceRow}
              >
                <Text style={styles.memberMeta}>
                  {row.direction === 'you_pay_them'
                    ? `You owe ${row.member}`
                    : `${row.member} owes you`}
                </Text>
                <TouchableOpacity
                  style={styles.payNowBtn}
                  onPress={() => openPayNowModal(row)}
                >
                  <Text style={styles.payNowBtnText}>
                    {row.direction === 'you_pay_them' ? 'Pay Now' : 'Request'} ₹
                    {row.amount.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyMeta}>No pending settlement actions.</Text>
          )}

          <Text style={styles.subSectionTitle}>Member Net Balances</Text>
          {balances?.net?.map((item) => (
            <View key={item.member} style={styles.balanceRow}>
              <Text style={styles.memberMeta}>{item.member}</Text>
              <Text
                style={[
                  styles.balanceAmount,
                  Number(item.amount) < 0
                    ? styles.balanceNegative
                    : styles.balancePositive,
                ]}
              >
                ₹{Number(item.amount).toFixed(2)}
              </Text>
            </View>
          ))}
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
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle}>{item.title}</Text>
                  <Text style={styles.expenseMeta}>
                    {item.category} • Paid by {item?.split?.paidBy || 'Unknown'}
                  </Text>
                  {item?.split?.participants?.length ? (
                    <Text style={styles.expenseMeta}>
                      Split with {item.split.participants.join(', ')}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.expenseActions}>
                  <Text style={styles.expenseAmount}>
                    ₹{Number(item.amount).toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() =>
                      navigation.navigate('AddGroupExpense', {
                        group,
                        expense: item,
                      })
                    }
                  >
                    <Text style={styles.editBtnText}>Edit Expense</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() =>
                      onDeleteExpense(
                        item as ExpenseItem & { expenseId?: string },
                      )
                    }
                  >
                    <Text style={styles.deleteBtnText}>Delete Expense</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.meta}>No group expenses yet.</Text>
          )}
        </View>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pay Now</Text>
            <Text style={styles.modalText}>
              {selectedSettlement
                ? `You are paying ₹${selectedSettlement.amount.toFixed(2)} to ${
                    selectedSettlement.member
                  }.`
                : ''}
            </Text>

            {isVerifying ? (
              <View style={styles.modalCenter}>
                <ActivityIndicator color={Colors.gold} />
                <Text style={styles.modalHint}>Verifying users...</Text>
              </View>
            ) : verification?.fromUserId && verification?.toUserId ? (
              <View style={styles.modalCenter}>
                <Text style={styles.payIcon}>₹</Text>
                <Text style={styles.modalHint}>
                  Users verified. Tap icon to pay.
                </Text>
              </View>
            ) : (
              <View style={styles.modalCenter}>
                <ActivityIndicator color={Colors.gold} />
                <Text style={styles.modalHint}>
                  Waiting for verification...
                </Text>
              </View>
            )}

            <Text style={styles.modalStatus}>Status: {paymentStatus}</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={styles.modalBtnSecondaryText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={onInitiatePayment}
                disabled={
                  isInitiatingPayment ||
                  !verification?.fromUserId ||
                  !verification?.toUserId
                }
              >
                {isInitiatingPayment ? (
                  <ActivityIndicator color="#111" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Pay</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  subSectionTitle: {
    color: '#EEE',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  summaryChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chipWarn: {
    borderRadius: 999,
    backgroundColor: '#3A1F1F',
    borderWidth: 1,
    borderColor: '#6E2F2F',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipWarnText: { color: '#FF9C9C', fontSize: 12, fontWeight: '700' },
  chipGood: {
    borderRadius: 999,
    backgroundColor: '#1E3528',
    borderWidth: 1,
    borderColor: '#2E7D4A',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipGoodText: { color: '#9BE7B7', fontSize: 12, fontWeight: '700' },
  memberMeta: { color: '#DDD', fontSize: 13 },
  emptyMeta: { color: '#777', fontSize: 12 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  payNowBtn: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#2A2200',
  },
  payNowBtnText: { color: Colors.gold, fontSize: 12, fontWeight: '700' },
  balanceAmount: { fontSize: 13, fontWeight: '700' },
  balancePositive: { color: '#9BE7B7' },
  balanceNegative: { color: '#FF9C9C' },
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
    alignItems: 'center',
  },
  expenseInfo: { flex: 1, paddingRight: 8 },
  expenseActions: { alignItems: 'flex-end', gap: 6 },
  expenseTitle: { color: '#FFF' },
  expenseMeta: { color: '#888', fontSize: 11, marginTop: 2 },
  expenseAmount: { color: '#FF8C8C', fontWeight: '700' },
  editBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.footer,
  },
  editBtnText: { color: Colors.gold, fontSize: 12, fontWeight: '700' },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#7A3333',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#2C1616',
  },
  deleteBtnText: { color: '#FF9C9C', fontSize: 12, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  modalText: { color: '#DDD' },
  modalHint: { color: '#BBB', fontSize: 12, marginTop: 6 },
  modalCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  payIcon: {
    color: Colors.gold,
    fontSize: 40,
    fontWeight: '800',
  },
  modalStatus: { color: Colors.gold, fontWeight: '700' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtnSecondary: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalBtnSecondaryText: { color: '#DDD', fontWeight: '700' },
  modalBtnPrimary: {
    backgroundColor: Colors.gold,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 68,
    alignItems: 'center',
  },
  modalBtnPrimaryText: { color: '#111', fontWeight: '800' },
});
