import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
