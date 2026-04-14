import './src/awsConfig';
import React, { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigation from './src/navigation/RootNavigation';

export default function App() {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        SplashScreen.hideAsync().catch(() => undefined);
      });
    });
    return () => task.cancel();
  }, []);

  return <RootNavigation />;
}
