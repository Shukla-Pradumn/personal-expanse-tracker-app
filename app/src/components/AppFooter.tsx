import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { isFinancialSetupComplete } from '../services/userProfile';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import type { FooterLink } from '../types/models';

const LINKS: FooterLink[] = [
  { label: 'Home', route: 'Dashboard', icon: 'home-outline' },
  { label: 'Groups', route: 'Groups', icon: 'account-group-outline' },
  { label: 'Add', route: 'AddExpense', icon: 'plus-circle-outline' },
  { label: 'Profile', route: 'Profile', icon: 'account-outline' },
];

export default function AppFooter() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const handleNavigate = async (targetRoute: string) => {
    if (targetRoute === 'Profile' || targetRoute === 'Groups') {
      navigation.navigate(targetRoute);
      return;
    }
    const setupComplete = await isFinancialSetupComplete().catch(() => false);
    if (!setupComplete) {
      Alert.alert(
        'Setup required',
        'Please save Monthly Budget and Savings Goal in Profile first.',
      );
      navigation.reset({ index: 0, routes: [{ name: 'Profile' }] });
      return;
    }
    navigation.navigate(targetRoute);
  };

  return (
    <View style={styles.footer}>
      {LINKS.map(link => {
        const active = route.name === link.route;
        return (
          <TouchableOpacity
            key={link.route}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => handleNavigate(link.route)}
          >
            <MaterialCommunityIcons
              name={link.icon as any}
              size={18}
                color={active ? Colors.gold : Colors.textHint}
              style={styles.icon}
            />
            <Text style={[styles.label, active && styles.labelActive]}>
              {link.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
    zIndex: 50,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 50,
    backgroundColor: Colors.footer,
    padding: 14,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
  },
  itemActive: {
    backgroundColor: 'rgba(245,197,24,0.12)',
  },
  label: {
    color: Colors.textHint,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  labelActive: {
    color: Colors.gold,
  },
  icon: {
    marginBottom: 2,
  },
});
