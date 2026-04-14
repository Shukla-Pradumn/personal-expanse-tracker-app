import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFocusEffect } from '@react-navigation/native';
import { getExpenses, getMonthlyBudget } from '../services/expenseStorage';
import { getUserProfile } from '../services/userProfile';
import { useRequireFinancialSetup } from '../hooks/useRequireFinancialSetup';
import AppFooter from '../components/AppFooter';
import { Colors } from '../theme/colors';
import type { ExpenseItem } from '../types/models';

const GOLD = Colors.gold;
const BG = Colors.background;
const CARD = Colors.card;
const BORDER = Colors.border;

const CHART_COLORS = [
  '#F5C518',
  '#F4A261',
  '#E76F51',
  '#2A9D8F',
  '#7B61FF',
  '#4CC9F0',
];

function ExpenseCard({ item }: { item: ExpenseItem }) {
  return (
    <View style={styles.expenseCard}>
      <View>
        <Text style={styles.expenseTitle}>{item.title}</Text>
        <Text style={styles.expenseMeta}>
          {item.category} • {item.date}
        </Text>
      </View>
      <Text style={styles.expenseAmount}>-₹{item.amount}</Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  useRequireFinancialSetup(navigation);
  const [expenses, setExpenses] = React.useState([]);
  const [monthlyBudget, setMonthlyBudget] = React.useState(30000);
  const [savingsGoal, setSavingsGoal] = React.useState(5000);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      Promise.all([
        getExpenses(),
        getMonthlyBudget(),
        getUserProfile().catch(() => null),
      ])
        .then(([savedExpenses, budget, profile]) => {
          if (!mounted) return;
          setExpenses(Array.isArray(savedExpenses) ? savedExpenses : []);
          setMonthlyBudget(
            Number.isFinite(Number(budget)) ? Number(budget) : 30000,
          );
          const goal = Number(profile?.savingsGoal);
          setSavingsGoal(Number.isFinite(goal) && goal > 0 ? goal : 5000);
        })
        .catch(() => {
          if (!mounted) return;
          setExpenses([]);
          setMonthlyBudget(30000);
          setSavingsGoal(5000);
        });
      return () => {
        mounted = false;
      };
    }, []),
  );

  const now = new Date();
  const safeExpenses = expenses.filter(
    item =>
      item &&
      typeof item === 'object' &&
      Number.isFinite(Number(item.amount)) &&
      item.date &&
      !Number.isNaN(new Date(item.date).getTime()),
  );

  const currentMonthExpenses = safeExpenses.filter(item => {
    const expenseDate = new Date(item.date);
    return (
      expenseDate.getMonth() === now.getMonth() &&
      expenseDate.getFullYear() === now.getFullYear()
    );
  });

  const totalSpent = currentMonthExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const remainingBudget = Math.max(monthlyBudget - totalSpent, 0);
  const savingsProgress =
    savingsGoal > 0
      ? Math.min(Math.round((remainingBudget / savingsGoal) * 100), 100)
      : 0;

  const categoryTotals = currentMonthExpenses.reduce<Record<string, number>>(
    (acc, item) => {
      const key = item.category || 'Other';
      acc[key] = (acc[key] || 0) + Number(item.amount || 0);
      return acc;
    },
    {},
  );

  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([key, value], index) => ({
      label: key,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  const recentExpenses = [...safeExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgLine} />

      <View style={styles.header}>
        <Text style={styles.appName}>BUDGET TRACKER</Text>
        <View style={styles.accentLine} />
        <Text style={styles.pageTitle}>Dashboard</Text>
        <Text style={styles.subText}>Track your spending at a glance</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Spent This Month</Text>
        <Text style={styles.balanceAmount}>₹{totalSpent.toLocaleString()}</Text>
        <Text style={styles.budgetText}>
          Monthly Budget: ₹{monthlyBudget.toLocaleString()}
        </Text>
        <Text style={styles.remainingText}>
          Remaining Budget: ₹{remainingBudget.toLocaleString()}
        </Text>
        <Text style={styles.savingsText}>
          Savings Goal: ₹{savingsGoal.toLocaleString()} (
          {Math.max(savingsProgress, 0)}%)
        </Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.actionBtnSecondaryText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={() => navigation.navigate('Comparison')}
        >
          <Text style={styles.actionBtnSecondaryText}>Comparison</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Category Breakdown</Text>
      <View style={styles.chartCard}>
        {categoryBreakdown.length ? (
          <View style={styles.breakdownWrap}>
            {categoryBreakdown.map(item => {
              const percent =
                totalSpent > 0
                  ? Math.round((item.value / totalSpent) * 100)
                  : 0;
              return (
                <View key={item.label} style={styles.breakdownRow}>
                  <View style={styles.breakdownHeader}>
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                    <Text style={styles.breakdownValue}>
                      ₹{item.value.toLocaleString()} ({percent}%)
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.max(percent, 3)}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyChartText}>No expenses this month yet.</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Recent 5 Expenses</Text>
      <FlatList
        data={recentExpenses}
        keyExtractor={(item, index) => String(item?.id || `expense-${index}`)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <ExpenseCard item={item} />}
      />
      <AppFooter />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
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
  header: { paddingTop: 12, marginBottom: 18 },
  appName: { fontSize: 11, letterSpacing: 5, color: GOLD, fontWeight: '700' },
  accentLine: {
    width: 34,
    height: 2,
    backgroundColor: GOLD,
    marginVertical: 8,
  },
  pageTitle: { fontSize: 30, fontWeight: '700', color: '#FFF' },
  subText: { color: '#777', marginTop: 4 },
  balanceCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  balanceLabel: { color: '#888', fontSize: 12, letterSpacing: 1 },
  balanceAmount: { color: GOLD, fontSize: 30, fontWeight: '800', marginTop: 8 },
  budgetText: { color: '#DDD', marginTop: 6, fontSize: 13, fontWeight: '600' },
  remainingText: { color: '#BBB', marginTop: 8, fontSize: 13 },
  savingsText: {
    color: '#8FD694',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  actionBtnSecondary: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondaryText: { color: '#DDD', fontWeight: '700', padding: 12 },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  chartCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 16,
    minHeight: 160,
  },
  emptyChartText: { color: '#777', fontSize: 14 },
  breakdownWrap: { gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
  breakdownRow: { gap: 6 },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { color: '#DDD', fontSize: 13, fontWeight: '600' },
  breakdownValue: { color: '#AAA', fontSize: 12 },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#2B2B2B',
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 8 },
  listContent: { gap: 10, paddingBottom: 20 },
  expenseCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  expenseMeta: { color: '#777', marginTop: 4, fontSize: 12 },
  expenseAmount: { color: '#FF6B6B', fontWeight: '700', fontSize: 16 },
  fab: {
    position: 'absolute',
    bottom: 86,
    right: 22,
    width: 58,
    height: 58,
    borderRadius: 30,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  fabText: { fontSize: 28, color: '#111', fontWeight: '700', lineHeight: 30 },
});
