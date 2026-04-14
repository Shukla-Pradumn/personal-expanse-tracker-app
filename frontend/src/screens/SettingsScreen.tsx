import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRequireFinancialSetup } from '../hooks/useRequireFinancialSetup';
import AppFooter from '../components/AppFooter';
import { Colors } from '../theme/colors';

const GOLD = Colors.gold;
const BG = Colors.background;
const CARD = Colors.card;
const BORDER = Colors.border;

export default function SettingsScreen({ navigation }) {
  useRequireFinancialSetup(navigation);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.key}>Currency</Text>
          <Text style={styles.value}>INR (₹)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.key}>Theme</Text>
          <Text style={styles.value}>Dark</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.key}>Data Source</Text>
          <Text style={styles.value}>Cloud API</Text>
        </View>
      </View>
      <AppFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingHorizontal: 16, paddingBottom: 88 },
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  key: { color: '#AAA' },
  value: { color: GOLD, fontWeight: '700' },
});
