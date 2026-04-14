import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getExpenses, getMonthlyBudget } from '../services/expenseStorage';
import { getUserProfile } from '../services/userProfile';
import { useRequireFinancialSetup } from '../hooks/useRequireFinancialSetup';
import AppFooter from '../components/AppFooter';
import { Colors } from '../theme/colors';
import type { ExpenseItem } from '../types/models';
import { Typography } from '../theme/typography';

const GOLD = Colors.gold;
const BG = Colors.background;
const CARD = Colors.card;
const BORDER = Colors.border;

function getTopCategory(expenses: ExpenseItem[]) {
  const totals = expenses.reduce<Record<string, number>>((acc, item) => {
    const key = item?.category || 'Other';
    acc[key] = (acc[key] || 0) + Number(item?.amount || 0);
    return acc;
  }, {});

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return 'N/A';
  return `${entries[0][0]} (₹${entries[0][1].toLocaleString()})`;
}

export default function ComparisonScreen({ navigation }) {
  useRequireFinancialSetup(navigation);
  const [currentMonthTotal, setCurrentMonthTotal] = React.useState(0);
  const [lastMonthTotal, setLastMonthTotal] = React.useState(0);
  const [budget, setBudget] = React.useState(30000);
  const [savingsGoal, setSavingsGoal] = React.useState(5000);
  const [currentTopCategory, setCurrentTopCategory] = React.useState('N/A');
  const [lastTopCategory, setLastTopCategory] = React.useState('N/A');

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      Promise.all([
        getExpenses(),
        getMonthlyBudget(),
        getUserProfile().catch(() => null),
      ])
        .then(([items, monthlyBudget, profile]) => {
          if (!mounted) return;

          const safeExpenses = (Array.isArray(items) ? items : []).filter(
            expense =>
              expense &&
              Number.isFinite(Number(expense.amount)) &&
              expense.date &&
              !Number.isNaN(new Date(expense.date).getTime()),
          );

          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear =
            currentMonth === 0 ? currentYear - 1 : currentYear;

          const current = safeExpenses.filter(expense => {
            const d = new Date(expense.date);
            return (
              d.getMonth() === currentMonth && d.getFullYear() === currentYear
            );
          });

          const last = safeExpenses.filter(expense => {
            const d = new Date(expense.date);
            return (
              d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
            );
          });

          const currentTotal = current.reduce(
            (sum, expense) => sum + Number(expense.amount || 0),
            0,
          );
          const previousTotal = last.reduce(
            (sum, expense) => sum + Number(expense.amount || 0),
            0,
          );

          setCurrentMonthTotal(currentTotal);
          setLastMonthTotal(previousTotal);
          setBudget(
            Number.isFinite(Number(monthlyBudget))
              ? Number(monthlyBudget)
              : 30000,
          );
          const goal = Number(profile?.savingsGoal);
          setSavingsGoal(Number.isFinite(goal) && goal > 0 ? goal : 5000);
          setCurrentTopCategory(getTopCategory(current));
          setLastTopCategory(getTopCategory(last));
        })
        .catch(() => {
          if (!mounted) return;
          setCurrentMonthTotal(0);
          setLastMonthTotal(0);
          setSavingsGoal(5000);
          setCurrentTopCategory('N/A');
          setLastTopCategory('N/A');
        });

      return () => {
        mounted = false;
      };
    }, []),
  );

  const delta = currentMonthTotal - lastMonthTotal;
  const deltaText =
    delta === 0
      ? 'No change'
      : delta > 0
      ? `↑ ₹${delta.toLocaleString()} vs last month`
      : `↓ ₹${Math.abs(delta).toLocaleString()} vs last month`;

  const currentBudgetUsage =
    budget > 0 ? Math.round((currentMonthTotal / budget) * 100) : 0;
  const lastBudgetUsage =
    budget > 0 ? Math.round((lastMonthTotal / budget) * 100) : 0;
  const currentSavings = Math.max(budget - currentMonthTotal, 0);
  const goalProgress =
    savingsGoal > 0
      ? Math.min(Math.round((currentSavings / savingsGoal) * 100), 100)
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Month Comparison</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>CURRENT MONTH</Text>
        <Text style={styles.amount}>₹{currentMonthTotal.toLocaleString()}</Text>
        <Text style={styles.meta}>
          Budget usage: {Math.max(currentBudgetUsage, 0)}%
        </Text>
        <Text style={styles.meta}>Top category: {currentTopCategory}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>LAST MONTH</Text>
        <Text style={styles.amount}>₹{lastMonthTotal.toLocaleString()}</Text>
        <Text style={styles.meta}>
          Budget usage: {Math.max(lastBudgetUsage, 0)}%
        </Text>
        <Text style={styles.meta}>Top category: {lastTopCategory}</Text>
      </View>

      <View style={styles.deltaCard}>
        <Text style={styles.deltaLabel}>Difference</Text>
        <Text
          style={[
            styles.deltaValue,
            delta > 0 ? styles.deltaUp : styles.deltaDown,
          ]}
        >
          {deltaText}
        </Text>
        <Text style={styles.meta}>
          Savings goal: ₹{savingsGoal.toLocaleString()} | Progress:{' '}
          {Math.max(goalProgress, 0)}%
        </Text>
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: Typography.weight.bold,
  },
  amount: { color: GOLD, fontSize: 28, fontWeight: '800', marginTop: 6 },
  meta: { color: '#BBB', marginTop: 6, fontSize: 13 },
  deltaCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  deltaLabel: { color: '#888', fontSize: 12 },
  deltaValue: { marginTop: 6, fontWeight: '700', fontSize: 15 },
  deltaUp: { color: '#FF8C8C' },
  deltaDown: { color: '#2ECC71' },
});
