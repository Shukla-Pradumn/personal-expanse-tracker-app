import React from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { isFinancialSetupComplete } from '../services/userProfile';

export function useRequireFinancialSetup(navigation: any) {
  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      isFinancialSetupComplete()
        .then(complete => {
          if (!active || complete) return;
          Alert.alert(
            'Setup required',
            'Please save Monthly Budget and Savings Goal in Profile to continue.',
          );
          navigation.reset({ index: 0, routes: [{ name: 'Profile' }] });
        })
        .catch(() => {
          if (!active) return;
          navigation.reset({ index: 0, routes: [{ name: 'Profile' }] });
        });

      return () => {
        active = false;
      };
    }, [navigation]),
  );
}
