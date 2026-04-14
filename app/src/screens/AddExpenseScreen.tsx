import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveExpense } from '../services/expenseStorage';
import { useRequireFinancialSetup } from '../hooks/useRequireFinancialSetup';
import AppFooter from '../components/AppFooter';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import type { ExpenseItem } from '../types/models';

interface AddExpenseScreenProps {
  navigation: any;
}

export default function AddExpenseScreen({
  navigation,
}: AddExpenseScreenProps) {
  useRequireFinancialSetup(navigation);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [dateInput, setDateInput] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState('');

  const categories = [
    'Food',
    'Transport',
    'Bills',
    'Shopping',
    'Health',
    'Subscription',
    'Other',
  ];

  const parseDateInput = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const constructed = new Date(year, month - 1, day);
    if (
      constructed.getFullYear() !== year ||
      constructed.getMonth() !== month - 1 ||
      constructed.getDate() !== day
    ) {
      return null;
    }
    return constructed;
  };

  const onSave = async () => {
    if (!title || !amount || !category) {
      Alert.alert('Missing details', 'Please fill title, amount and category.');
      return;
    }

    const numericAmount = Number(String(amount).replace(/,/g, '').trim());
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }

    const parsedDate = parseDateInput(dateInput);
    if (!parsedDate) {
      Alert.alert('Invalid date', 'Please enter date in YYYY-MM-DD format.');
      return;
    }

    try {
      const payload: ExpenseItem = {
        id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        title: title.trim(),
        amount: Number(numericAmount.toFixed(2)),
        category,
        date: parsedDate.toISOString(),
        notes: notes.trim(),
      };
      await saveExpense(payload);
      Alert.alert('Expense added', 'Your expense has been saved successfully.');
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } catch (error) {
      Alert.alert(
        'Save failed',
        error?.message
          ? `Could not save expense. ${error.message}`
          : 'Could not save expense. Please try again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Expense</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>AMOUNT</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 1200"
          placeholderTextColor="#555"
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.label}>TITLE</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Grocery shopping"
          placeholderTextColor="#555"
          style={styles.input}
        />

        <Text style={styles.label}>CATEGORY</Text>
        <TouchableOpacity
          style={styles.input}
          activeOpacity={0.85}
          onPress={() => setShowCategoryList(prev => !prev)}
        >
          <Text style={styles.dateText}>{category}</Text>
        </TouchableOpacity>
        {showCategoryList && (
          <View style={styles.categoryList}>
            {categories.map(item => (
              <TouchableOpacity
                key={item}
                style={styles.categoryItem}
                onPress={() => {
                  setCategory(item);
                  setShowCategoryList(false);
                }}
              >
                <Text style={styles.categoryItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>DATE</Text>
        <TextInput
          value={dateInput}
          onChangeText={setDateInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#555"
          style={styles.input}
        />

        <Text style={styles.label}>NOTES</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes"
          placeholderTextColor="#555"
          style={[styles.input, styles.notesInput]}
          multiline
        />

        <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveText}>SAVE EXPENSE</Text>
        </TouchableOpacity>
      </View>
      <AppFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingBottom: 88,
  },
  header: { paddingTop: 10, marginBottom: 16 },
  back: {
    color: Colors.gold,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    marginBottom: 12,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
  },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 16,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 10,
    fontWeight: Typography.weight.bold,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.footer,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  dateText: { color: Colors.textPrimary },
  categoryList: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.footer,
    marginTop: 6,
    overflow: 'hidden',
  },
  categoryItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryItemText: { color: Colors.textPrimary },
  notesInput: { height: 90, textAlignVertical: 'top', paddingTop: 12 },
  saveBtn: {
    marginTop: 20,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#111',
    fontWeight: Typography.weight.extrabold,
    letterSpacing: 2,
  },
});
