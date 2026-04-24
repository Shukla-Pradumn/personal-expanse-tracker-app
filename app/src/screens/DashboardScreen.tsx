import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
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

const MAX_SMART_TAGS = 8;

function parseFilterDate(value: string): Date | null {
  const text = String(value || '').trim();
  if (!text) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

//this is for get the smart tags
function getSmartTags(items: ExpenseItem[]) {
  const tags = new Set<string>();
  items.forEach((item) => {
    const category = String(item.category || '').trim();
    const merchant = String(item.merchant || '').trim();
    if (category) tags.add(category);
    if (merchant) tags.add(merchant);
    const noteText = String(item.notes || '');
    const hashTags = noteText.match(/#[a-zA-Z0-9_]+/g) || [];
    hashTags.forEach((tag) => tags.add(tag));
  });
  return [...tags].sort((a, b) => a.localeCompare(b)).slice(0, MAX_SMART_TAGS);
}

//this is for the expense card
function ExpenseCard({ item }: { item: ExpenseItem }) {
  const merchant = String(item.merchant || '').trim();
  const isSplitExpense = Boolean(item.split?.isSplit);
  const paidBy = String(item.split?.paidBy || '').trim();
  const myShare = item.split?.shares?.find(
    (share) => String(share?.participant || '').toLowerCase() === 'you',
  );
  return (
    <View style={styles.expenseCard}>
      <View>
        <Text style={styles.expenseTitle}>{item.title}</Text>
        <Text style={styles.expenseMeta}>
          {item.category}
          {merchant ? ` • ${merchant}` : ''} •{' '}
          {new Date(item.date).toLocaleDateString()}
        </Text>
        {item.notes ? (
          <Text style={styles.expenseNotes}>{item.notes}</Text>
        ) : null}
        {isSplitExpense ? (
          <Text style={styles.splitHint}>
            Split • Paid by {paidBy || 'Unknown'}
            {myShare ? ` • Your share ₹${myShare.amount}` : ''}
          </Text>
        ) : null}
      </View>
      <Text style={styles.expenseAmount}>-₹{item.amount}</Text>
    </View>
  );
}

//this is for the dashboard screen
export default function DashboardScreen({ navigation }) {
  useRequireFinancialSetup(navigation);
  const [expenses, setExpenses] = React.useState<ExpenseItem[]>([]);
  const [monthlyBudget, setMonthlyBudget] = React.useState(30000);
  const [savingsGoal, setSavingsGoal] = React.useState(5000);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [fromDateInput, setFromDateInput] = React.useState('');
  const [toDateInput, setToDateInput] = React.useState('');
  const [activeTag, setActiveTag] = React.useState('');
  const [showAllExpenses, setShowAllExpenses] = React.useState(false);

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
    (item) =>
      item &&
      typeof item === 'object' &&
      Number.isFinite(Number(item.amount)) &&
      item.date &&
      !Number.isNaN(new Date(item.date).getTime()),
  );

  const currentMonthExpenses = safeExpenses.filter((item) => {
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

  //this is for get the category breakdown
  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([key, value], index) => ({
      label: key,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  //this is for sort the expenses
  const sortedExpenses = [...safeExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  //this is for get the smart tags
  const smartTags = getSmartTags(sortedExpenses);

  //this is for parse the filter date
  const fromDate = parseFilterDate(fromDateInput);
  const toDate = parseFilterDate(toDateInput);
  const toDateInclusive = toDate
    ? new Date(
        toDate.getFullYear(),
        toDate.getMonth(),
        toDate.getDate(),
        23,
        59,
        59,
        999,
      )
    : null;
  const query = searchQuery.trim().toLowerCase();
  const activeTagLower = activeTag.trim().toLowerCase();

  const filteredExpenses = sortedExpenses.filter((item) => {
    const date = new Date(item.date);
    if (fromDate && date < fromDate) return false;
    if (toDateInclusive && date > toDateInclusive) return false;

    const searchHaystack = [
      item.title,
      item.merchant,
      item.notes,
      item.category,
    ]
      .map((value) => String(value || '').toLowerCase())
      .join(' ');

    if (query && !searchHaystack.includes(query)) return false;
    if (activeTagLower && !searchHaystack.includes(activeTagLower))
      return false;
    return true;
  });
  const hasActiveFilters = Boolean(
    query || activeTagLower || fromDateInput.trim() || toDateInput.trim(),
  );
  const displayExpenses = hasActiveFilters
    ? filteredExpenses
    : showAllExpenses
    ? sortedExpenses
    : sortedExpenses.slice(0, 5);

  const splitSummary = sortedExpenses.reduce(
    (acc, expense) => {
      if (!expense.split?.isSplit) return acc;

      const paidBy = String(expense.split.paidBy || '')
        .trim()
        .toLowerCase();
      const shares = Array.isArray(expense.split.shares)
        ? expense.split.shares
        : [];
      const myShare = shares.find(
        (share) =>
          String(share?.participant || '')
            .trim()
            .toLowerCase() === 'you',
      );
      const myShareAmount = Number(myShare?.amount || 0);
      const totalAmount = Number(expense.amount || 0);

      if (paidBy === 'you') {
        acc.owedToYou += Math.max(totalAmount - myShareAmount, 0);
      } else if (myShareAmount > 0) {
        acc.youOwe += myShareAmount;
      }
      return acc;
    },
    { youOwe: 0, owedToYou: 0 },
  );
  const splitNet = splitSummary.owedToYou - splitSummary.youOwe;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgLine} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.appName}>BUDGET TRACKER</Text>
          <View style={styles.accentLine} />
          <Text style={styles.pageTitle}>Dashboard</Text>
          <Text style={styles.subText}>Track your spending at a glance</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Spent This Month</Text>
          <Text style={styles.balanceAmount}>
            ₹{totalSpent.toLocaleString()}
          </Text>
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

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Split Summary</Text>
          <Text style={styles.budgetText}>
            You owe: ₹{splitSummary.youOwe.toFixed(0)}
          </Text>
          <Text style={styles.budgetText}>
            Owed to you: ₹{splitSummary.owedToYou.toFixed(0)}
          </Text>
          <Text
            style={[
              styles.savingsText,
              splitNet < 0 ? styles.splitNegative : styles.splitPositive,
            ]}
          >
            Net: {splitNet >= 0 ? '+' : '-'}₹{Math.abs(splitNet).toFixed(0)}
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
              {categoryBreakdown.map((item) => {
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
            <Text style={styles.emptyChartText}>
              No expenses this month yet.
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Smart Search</Text>
        <View style={styles.filterCard}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search title, merchant, notes..."
            placeholderTextColor="#666"
            style={styles.filterInput}
          />
          <View style={styles.dateRow}>
            <TextInput
              value={fromDateInput}
              onChangeText={setFromDateInput}
              placeholder="From YYYY-MM-DD"
              placeholderTextColor="#666"
              style={[styles.filterInput, styles.dateInput]}
            />
            <TextInput
              value={toDateInput}
              onChangeText={setToDateInput}
              placeholder="To YYYY-MM-DD"
              placeholderTextColor="#666"
              style={[styles.filterInput, styles.dateInput]}
            />
          </View>
          {smartTags.length ? (
            <View style={styles.tagsWrap}>
              {smartTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    activeTag === tag ? styles.tagChipActive : null,
                  ]}
                  onPress={() =>
                    setActiveTag((prev) => (prev === tag ? '' : tag))
                  }
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      activeTag === tag ? styles.tagChipTextActive : null,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              setSearchQuery('');
              setFromDateInput('');
              setToDateInput('');
              setActiveTag('');
              setShowAllExpenses(false);
            }}
          >
            <Text style={styles.clearBtnText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {hasActiveFilters
              ? `Filtered Expenses (${filteredExpenses.length})`
              : showAllExpenses
              ? `All Expenses (${displayExpenses.length})`
              : `Recent Expenses (${displayExpenses.length})`}
          </Text>
          {!hasActiveFilters && sortedExpenses.length > 5 ? (
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => setShowAllExpenses((prev) => !prev)}
            >
              <Text style={styles.seeAllBtnText}>
                {showAllExpenses ? 'Show Recent 5' : 'See All'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.listContent}>
          {displayExpenses.length ? (
            displayExpenses.map((item, index) => (
              <ExpenseCard
                key={String(item?.id || `expense-${index}`)}
                item={item}
              />
            ))
          ) : (
            <Text style={styles.emptyChartText}>
              {hasActiveFilters
                ? 'No expenses match these filters.'
                : 'No expenses available yet.'}
            </Text>
          )}
        </View>
      </ScrollView>
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
  },
  scrollContent: { paddingBottom: 120 },
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
    flex: 1,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllBtn: {
    marginBottom: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 999,
    backgroundColor: '#161616',
  },
  seeAllBtnText: { color: GOLD, fontSize: 12, fontWeight: '700' },
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
  filterCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  filterInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#161616',
    color: '#EEE',
    paddingHorizontal: 12,
  },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateInput: { flex: 1 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#161616',
  },
  tagChipActive: {
    borderColor: GOLD,
    backgroundColor: 'rgba(245,197,24,0.15)',
  },
  tagChipText: { color: '#BBB', fontSize: 12, fontWeight: '600' },
  tagChipTextActive: { color: GOLD },
  clearBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  clearBtnText: { color: GOLD, fontSize: 12, fontWeight: '700' },
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
  expenseNotes: { color: '#999', marginTop: 4, fontSize: 12, maxWidth: 220 },
  splitHint: { color: GOLD, marginTop: 4, fontSize: 11, fontWeight: '600' },
  expenseAmount: { color: '#FF6B6B', fontWeight: '700', fontSize: 16 },
  splitPositive: { color: '#2ECC71' },
  splitNegative: { color: '#FF8C8C' },
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
