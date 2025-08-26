import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  Linking,
  SafeAreaView,
} from 'react-native';

import InitializationScreen from './src/components/Messaging/InitializationScreen';
import ConnectionScreen from './src/components/Messaging/ConnectionScreen';
import ChatScreen from './src/components/Messaging/ChatScreen';
import { useBLE } from './src/hooks/useBLE';
import { useMessages } from './src/hooks/useMessages';
import { useDebug } from './src/hooks/useDebug';
import { useDeviceConnection } from './src/hooks/useDeviceConnection';
import styles from './src/styles/AppStyles';
import OnboardingFlow from './src/pages/Onboarding';
import { initDB, insertUserData } from './src/database/database';
import UserInfo from './src/pages/userInfo'; 

export default function HikeSafeApp() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [inputText, setInputText] = useState('');
  const [availableDevices, setAvailableDevices] = useState([]);

  // Initialize database once at startup
  useEffect(() => {
    initDB();
  }, []);
  
  // Custom hooks
  const { debugInfo, addDebugInfo } = useDebug();
  const { manager, bleState, permissionsGranted, bleManagerRef, cleanup } = useBLE(addDebugInfo);
  const { messages, setMessages, addMessage, clearMessages } = useMessages(addDebugInfo);
  const { 
    device, 
    isConnected, 
    meshStatus, 
    setDevice, 
    setIsConnected, 
    setMeshStatus, 
    connectToDevice, 
    disconnect 
  } = useDeviceConnection(bleManagerRef, addDebugInfo, addMessage);

  // Handle onboarding completion and save to SQLite
  const handleOnboardingComplete = async (userData) => {
    try {
      await insertUserData(userData);
      console.log('User data saved ✅');
      setShowOnboarding(false);
      setShowUserInfo(true); // Show UserInfo screen after onboarding
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  };

  // Handle UserInfo completion
  const handleUserInfoComplete = () => {
    setShowUserInfo(false); // This will proceed to the BLE flow
  };

  // Show onboarding screen first
  if (showOnboarding) {
    return (
      <OnboardingFlow onComplete={handleOnboardingComplete} />
    );
  }

  // Show UserInfo screen after onboarding completion
  if (showUserInfo) {
    return (
      <UserInfo onComplete={handleUserInfoComplete} />
    );
  }

  // Show initialization screen while BLE is setting up
  if (!manager || !permissionsGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
        <InitializationScreen 
          bleState={bleState}
          debugInfo={debugInfo}
          onOpenSettings={() => Linking.openSettings()}
        />
      </SafeAreaView>
    );
  }

  // Show connection screen when not connected
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
        <ConnectionScreen
          bleState={bleState}
          isScanning={isScanning}
          setIsScanning={setIsScanning}
          availableDevices={availableDevices}
          setAvailableDevices={setAvailableDevices}
          debugInfo={debugInfo}
          messages={messages}
          connectToDevice={(deviceId) => connectToDevice(deviceId, messages)}
          clearMessages={clearMessages}
          bleManagerRef={bleManagerRef}
          addDebugInfo={addDebugInfo}
        />
      </SafeAreaView>
    );
  }

  // Show chat screen when connected
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      <ChatScreen
        device={device}
        isConnected={isConnected}
        messages={messages}
        inputText={inputText}
        setInputText={setInputText}
        meshStatus={meshStatus}
        onDisconnect={disconnect}
        addMessage={addMessage}
        addDebugInfo={addDebugInfo}
      />
    </SafeAreaView>
  );
}