import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import {
  createGroupExpense,
  getGroupMembers,
  updateGroupExpense,
} from '../services/groupService';
import type { ExpenseItem } from '../types/models';

export default function AddGroupExpenseScreen({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const group = route?.params?.group;
  const editableExpense = (route?.params?.expense || null) as
    | (ExpenseItem & { expenseId?: string })
    | null;
  const isEditMode = Boolean(editableExpense);
  const expenseId = String(editableExpense?.id || editableExpense?.expenseId || '');
  const groupId = String(group?.groupId || '');
  const [title, setTitle] = useState(String(editableExpense?.title || ''));
  const [amount, setAmount] = useState(
    editableExpense?.amount ? String(editableExpense.amount) : '',
  );
  const [category, setCategory] = useState(
    String(editableExpense?.category || 'Food'),
  );
  const [notes, setNotes] = useState(String(editableExpense?.notes || ''));
  const [dateInput, setDateInput] = useState(
    editableExpense?.date
      ? String(editableExpense.date).slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const [isEqualSplit, setIsEqualSplit] = useState(
    editableExpense?.split?.splitMethod !== 'custom',
  );
  const [paidBy, setPaidBy] = useState(String(editableExpense?.split?.paidBy || 'You'));
  const [showPaidByList, setShowPaidByList] = useState(false);
  const [participantsInput, setParticipantsInput] = useState(
    Array.isArray(editableExpense?.split?.participants) &&
      editableExpense?.split?.participants?.length
      ? editableExpense.split.participants.join(', ')
      : 'You',
  );
  const [customSharesInput, setCustomSharesInput] = useState<
    Record<string, string>
  >(
    editableExpense?.split?.splitMethod === 'custom'
      ? (editableExpense?.split?.shares || []).reduce(
          (acc, share) => ({
            ...acc,
            [share.participant]: String(share.amount),
          }),
          {} as Record<string, string>,
        )
      : {},
  );
  const [members, setMembers] = useState<string[]>([]);

  React.useEffect(() => {
    if (!groupId) return;
    getGroupMembers(groupId)
      .then((items) => {
        const names = items
          .map((item) =>
            String(item.name || item.email || item.userId || '').trim(),
          )
          .filter(Boolean);
        if (names.length) {
          setMembers(names);
          if (!isEditMode) {
            setParticipantsInput(names.join(', '));
          }
          // Keep paidBy valid when participant list is loaded from group members.
          if (!names.includes(paidBy)) {
            setPaidBy(names[0]);
          }
        }
      })
      .catch(() => undefined);
  }, [groupId, paidBy, isEditMode]);

  const participants = useMemo(() => {
    const unique = new Set(
      participantsInput
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    );
    if (!unique.size) unique.add('You');
    return [...unique];
  }, [participantsInput]);

  const onSave = async () => {
    if (!groupId) {
      Alert.alert(
        'Missing group',
        'Unable to resolve group. Please go back and retry.',
      );
      return;
    }

    const parsedAmount = Number(String(amount).replace(/,/g, '').trim());
    if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid details', 'Please enter valid title and amount.');
      return;
    }
    if (participants.length < 2) {
      Alert.alert(
        'Split requires members',
        'Please add at least two participants.',
      );
      return;
    }
    const normalizedPaidBy = String(paidBy || '').trim() || 'You';
    if (!participants.includes(normalizedPaidBy)) {
      Alert.alert(
        'Invalid split setup',
        '"Paid By" must be one of participants.',
      );
      return;
    }
    const parsedDate = new Date(dateInput);
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert('Invalid date', 'Please enter date in YYYY-MM-DD format.');
      return;
    }

    const rounded = Number(parsedAmount.toFixed(2));
    const shares = isEqualSplit
      ? participants.map((p) => ({
          participant: p,
          amount: Number((rounded / participants.length).toFixed(2)),
          settled: false,
        }))
      : participants.map((p) => ({
          participant: p,
          amount: Number(
            String(customSharesInput[p] || '')
              .replace(/,/g, '')
              .trim(),
          ),
          settled: false,
        }));

    if (!isEqualSplit) {
      if (
        shares.some(
          (share) => !Number.isFinite(share.amount) || share.amount < 0,
        )
      ) {
        Alert.alert('Invalid custom split', 'Please enter valid amounts.');
        return;
      }
      const total = Number(
        shares.reduce((sum, share) => sum + share.amount, 0).toFixed(2),
      );
      if (total !== rounded) {
        Alert.alert('Split mismatch', `Shares must total ₹${rounded}.`);
        return;
      }
    }

    const payload: ExpenseItem = {
      id: expenseId || `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      title: title.trim(),
      amount: rounded,
      category,
      date: parsedDate.toISOString(),
      notes: notes.trim(),
      split: {
        isSplit: true,
        splitMethod: isEqualSplit ? 'equal' : 'custom',
        paidBy: normalizedPaidBy,
        participants,
        shares,
      },
    };

    try {
      console.log('Saving group expense =>', { groupId, payload });
      if (isEditMode && expenseId) {
        await updateGroupExpense(groupId, expenseId, payload);
      } else {
        await createGroupExpense(groupId, payload);
      }
      Alert.alert('Saved', isEditMode ? 'Group expense updated.' : 'Group expense saved.');
      navigation.goBack();
    } catch (error: any) {
      console.log('Save group expense failed =>', error?.message || error);
      Alert.alert(
        'Save failed',
        error?.message || 'Could not save group expense. Please try again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditMode ? 'Edit Group Expense' : 'Add Group Expense'}
          </Text>
          <Text style={styles.groupMeta}>{group?.name || groupId}</Text>

          <View style={styles.card}>
            <Text style={styles.label}>TITLE</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />
            <Text style={styles.label}>AMOUNT</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <Text style={styles.label}>CATEGORY</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
            />
            <Text style={styles.label}>DATE (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={dateInput}
              onChangeText={setDateInput}
            />
            <Text style={styles.label}>PAID BY</Text>
            <TouchableOpacity
              style={[styles.input, styles.selectInput]}
              activeOpacity={0.85}
              onPress={() => setShowPaidByList((prev) => !prev)}
            >
              <Text style={styles.inputText}>{paidBy}</Text>
            </TouchableOpacity>
            {showPaidByList ? (
              <View style={styles.optionList}>
                {(members.length ? members : participants).map((member) => (
                  <TouchableOpacity
                    key={member}
                    style={styles.optionItem}
                    onPress={() => {
                      setPaidBy(member);
                      setShowPaidByList(false);
                    }}
                  >
                    <Text style={styles.optionText}>{member}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <Text style={styles.label}>PARTICIPANTS (comma-separated)</Text>
            <TextInput
              style={styles.input}
              value={participantsInput}
              onChangeText={(value) => {
                setParticipantsInput(value);
                setShowPaidByList(false);
                const latest = value
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean);
                setCustomSharesInput((prev) => {
                  const next: Record<string, string> = {};
                  latest.forEach((name) => {
                    next[name] = prev[name] ?? '';
                  });
                  return next;
                });
              }}
            />
            {members.length ? (
              <Text style={styles.hint}>
                Group members: {members.join(', ')}
              </Text>
            ) : null}

            <View style={styles.row}>
              <Text style={styles.label}>EQUAL SPLIT</Text>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  isEqualSplit ? styles.toggleActive : null,
                ]}
                onPress={() => setIsEqualSplit((prev) => !prev)}
              >
                <Text style={styles.toggleText}>
                  {isEqualSplit ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            {!isEqualSplit
              ? participants.map((participant) => (
                  <View key={participant}>
                    <Text style={styles.label}>
                      SHARE - {participant.toUpperCase()}
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={customSharesInput[participant] || ''}
                      onChangeText={(value) =>
                        setCustomSharesInput((prev) => ({
                          ...prev,
                          [participant]: value,
                        }))
                      }
                      keyboardType="numeric"
                    />
                  </View>
                ))
              : null}

            <Text style={styles.label}>NOTES</Text>
            <TextInput
              style={[styles.input, styles.notes]}
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
              <Text style={styles.saveText}>
                {isEditMode ? 'UPDATE GROUP EXPENSE' : 'SAVE GROUP EXPENSE'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  flex: { flex: 1 },
  content: { paddingBottom: 24 },
  back: {
    color: Colors.gold,
    marginTop: 8,
    marginBottom: 10,
    fontWeight: '700',
  },
  title: { color: '#FFF', fontSize: 28, fontWeight: '700' },
  groupMeta: { color: '#777', marginBottom: 12 },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.3,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.footer,
    color: '#FFF',
    paddingHorizontal: 12,
  },
  selectInput: {
    justifyContent: 'center',
  },
  inputText: { color: '#FFF' },
  optionList: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.footer,
    marginTop: 6,
    overflow: 'hidden',
  },
  optionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: { color: '#FFF' },
  hint: { color: '#888', marginTop: 6, fontSize: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    backgroundColor: Colors.footer,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleActive: { borderColor: Colors.gold, backgroundColor: '#2A2200' },
  toggleText: { color: '#FFF', fontWeight: '700', fontSize: 11 },
  notes: { height: 90, textAlignVertical: 'top', paddingTop: 12 },
  saveBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 10,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveText: { color: '#111', fontWeight: '800', letterSpacing: 1.4 },
});
