// App.js - Clean and minimal
import React from 'react';
import { StatusBar } from 'react-native';
import AppProvider from './src/providers/AppProvider';
import AppNavigator from './src/navigation/AppNavigator';

export default function HikeSafeApp() {
  return (
    <AppProvider>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      <AppNavigator />
    </AppProvider>
  );
}