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

export default function HelpSupportScreen({ navigation }) {
  useRequireFinancialSetup(navigation);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Need help?</Text>
        <Text style={styles.text}>
          - Use Profile to update your name and monthly budget.
        </Text>
        <Text style={styles.text}>
          - Add expenses from the Add Expense screen.
        </Text>
        <Text style={styles.text}>
          - If sync fails, check API URL and internet connection.
        </Text>
        <Text style={styles.contact}>pradumn.shukla@incaendo.com</Text>
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
    gap: 10,
  },
  heading: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  text: { color: '#BBB', fontSize: 14, lineHeight: 22 },
  contact: { color: GOLD, marginTop: 8, fontWeight: '700' },
});
