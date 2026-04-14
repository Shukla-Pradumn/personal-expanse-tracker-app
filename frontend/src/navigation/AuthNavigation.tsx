import React from 'react';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ConfirmOtpScreen from '../screens/ConfirmOtpScreen';

export function renderAuthScreens(Stack: any) {
  return (
    <>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ConfirmOtp" component={ConfirmOtpScreen} />
    </>
  );
}
