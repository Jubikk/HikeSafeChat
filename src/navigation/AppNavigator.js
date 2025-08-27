// src/navigation/AppNavigator.js - Navigation Logic
import React from 'react';
import { SafeAreaView, Linking } from 'react-native';
import { useAppContext } from '../providers/AppProvider';
import OnboardingFlow from '../pages/Onboarding';
import HikingLoginScreen from '../pages/Login';
import UserInfo from '../pages/userInfo';
import InitializationScreen from '../components/Messaging/InitializationScreen';
import ConnectionScreen from '../components/Messaging/ConnectionScreen';
import ChatScreen from '../components/Messaging/ChatScreen';
import styles from '../styles/AppStyles';

export default function AppNavigator() {
  const {
    // App Flow
    showOnboarding,
    showLogin,
    showUserInfo,
    handleOnboardingComplete,
    handleLoginComplete,
    handleUserInfoComplete,
    
    // BLE
    manager,
    permissionsGranted,
    bleState,
    isConnected,
    
    // Other states and functions
    isScanning,
    setIsScanning,
    availableDevices,
    setAvailableDevices,
    inputText,
    setInputText,
    debugInfo,
    messages,
    device,
    meshStatus,
    connectToDevice,
    disconnect,
    clearMessages,
    addMessage,
    addDebugInfo,
    bleManagerRef,
  } = useAppContext();

  // Show onboarding screen first
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Show login screen after onboarding completion
  if (showLogin) {
    return <HikingLoginScreen onLoginComplete={handleLoginComplete} />;
  }

  // Show user info screen
  if (showUserInfo) {
    return <UserInfo onComplete={handleUserInfoComplete} />;
  }
  
  // Show initialization screen while BLE is setting up
  if (!manager || !permissionsGranted) {
    return (
      <SafeAreaView style={styles.container}>
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