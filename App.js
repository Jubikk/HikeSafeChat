import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  Linking,
} from 'react-native';

import InitializationScreen from './components/InitializationScreen';
import ConnectionScreen from './components/ConnectionScreen';
import ChatScreen from './components/ChatScreen';
import { useBLE } from './hooks/useBLE';
import { useMessages } from './hooks/useMessages';
import { useDebug } from './hooks/useDebug';
import { useDeviceConnection } from './hooks/useDeviceConnection';
import styles from './styles/AppStyles';

export default function HikeSafeApp() {
  const [isScanning, setIsScanning] = useState(false);
  const [inputText, setInputText] = useState('');
  const [availableDevices, setAvailableDevices] = useState([]);
  
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