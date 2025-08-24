import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InitializationScreen from './components/InitializationScreen';
import ConnectionScreen from './components/ConnectionScreen';
import ChatScreen from './components/ChatScreen';
import { BLE_CONFIG, STORAGE_KEYS } from './config/constants';
import styles from './styles/AppStyles';

export default function HikeSafeApp() {
  const [manager, setManager] = useState(null);
  const [device, setDevice] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [meshStatus, setMeshStatus] = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [bleState, setBleState] = useState('Unknown');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  
  const bleManagerRef = useRef(null);
  const stateSubscriptionRef = useRef(null);

  const addDebugInfo = (message) => {
    console.log('DEBUG:', message);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    initializeBLE();
    loadStoredData();
    
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    try {
      addDebugInfo('Starting cleanup...');
      
      if (stateSubscriptionRef.current) {
        try {
          stateSubscriptionRef.current.remove();
          stateSubscriptionRef.current = null;
        } catch (e) {
          console.warn('Error removing subscription:', e);
        }
      }

      if (device && isConnected) {
        try {
          device.cancelConnection();
        } catch (e) {
          console.warn('Error disconnecting device:', e);
        }
      }

      if (bleManagerRef.current) {
        try {
          bleManagerRef.current.destroy();
          bleManagerRef.current = null;
        } catch (e) {
          console.warn('Error destroying manager:', e);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const initializeBLE = async () => {
    try {
      addDebugInfo('Starting BLE initialization...');
      
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        addDebugInfo('Permissions denied');
        Alert.alert(
          'Permissions Required', 
          'Bluetooth and location permissions are required. Please grant them in Settings.',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Cancel' }
          ]
        );
        return;
      }
      
      addDebugInfo('Permissions granted, creating BLE manager');
      
      const bleManager = new BleManager();
      setManager(bleManager);
      bleManagerRef.current = bleManager;
      
      const subscription = bleManager.onStateChange((state) => {
        addDebugInfo(`BLE State changed: ${state}`);
        setBleState(state);
        
        if (state === 'PoweredOn') {
          addDebugInfo('BLE is ready for scanning');
          setPermissionsGranted(true);
        } else if (state === 'PoweredOff') {
          setPermissionsGranted(false);
          setTimeout(() => {
            if (bleState === 'PoweredOff') {
              Alert.alert('Bluetooth Off', 'Please turn on Bluetooth to use this app.');
            }
          }, 2000);
        } else if (state === 'Unauthorized') {
          setPermissionsGranted(false);
          Alert.alert(
            'Bluetooth Permission Denied',
            'Please grant Bluetooth permission in Settings.',
            [{ text: 'Open Settings', onPress: () => Linking.openSettings() }]
          );
        }
      }, true);

      stateSubscriptionRef.current = subscription;

    } catch (error) {
      addDebugInfo(`BLE init error: ${error.message}`);
      Alert.alert('BLE Error', 'Failed to initialize Bluetooth: ' + error.message);
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const apiLevel = parseInt(Platform.Version, 10);
        addDebugInfo(`Android API Level: ${apiLevel}`);
        
        let permissions = [];
        
        if (apiLevel >= 31) {
          permissions = [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ];
        } else if (apiLevel >= 23) {
          permissions = [
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
          ];
        } else {
          addDebugInfo('Old Android version, no runtime permissions needed');
          return true;
        }
        
        addDebugInfo(`Requesting permissions: ${permissions.join(', ')}`);
        
        const results = await PermissionsAndroid.requestMultiple(permissions);
        
        Object.entries(results).forEach(([permission, result]) => {
          addDebugInfo(`${permission.split('.').pop()}: ${result}`);
        });
        
        const allGranted = Object.values(results).every(result => 
          result === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allGranted) {
          const deniedPermissions = Object.entries(results)
            .filter(([_, result]) => result !== PermissionsAndroid.RESULTS.GRANTED)
            .map(([permission, _]) => permission.split('.').pop());
          
          addDebugInfo(`Denied permissions: ${deniedPermissions.join(', ')}`);
          
          Alert.alert(
            'Permissions Required',
            `This app needs the following permissions to work:\n\n${deniedPermissions.join('\n')}\n\nPlease grant them in Settings.`,
            [
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              { text: 'Try Again', onPress: () => requestPermissions() },
              { text: 'Cancel' }
            ]
          );
        } else {
          addDebugInfo('All permissions granted');
        }
        
        return allGranted;
      }
      
      addDebugInfo('iOS - permissions handled via Info.plist');
      return true;
      
    } catch (error) {
      addDebugInfo(`Permission request error: ${error.message}`);
      return false;
    }
  };

  const loadStoredData = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        setMessages(Array.isArray(parsedMessages) ? parsedMessages : []);
      }

      const lastDeviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE);
      if (lastDeviceId) {
        addDebugInfo(`Last device found: ${lastDeviceId.substring(0, 8)}...`);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
      addDebugInfo(`Error loading stored data: ${error.message}`);
    }
  };

  const saveMessages = async (newMessages) => {
    try {
      if (Array.isArray(newMessages)) {
        await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(newMessages));
      }
    } catch (error) {
      console.error('Error saving messages:', error);
      addDebugInfo(`Error saving messages: ${error.message}`);
    }
  };

  const addMessage = (message) => {
    if (!message || typeof message !== 'object') {
      addDebugInfo('Invalid message object');
      return;
    }

    const newMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...message,
    };
    
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, newMessage];
      saveMessages(updatedMessages);
      return updatedMessages;
    });
  };

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
          setMessages={setMessages}
          setDevice={setDevice}
          setIsConnected={setIsConnected}
          setMeshStatus={setMeshStatus}
          addDebugInfo={addDebugInfo}
          addMessage={addMessage}
          bleManagerRef={bleManagerRef}
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
        setDevice={setDevice}
        setIsConnected={setIsConnected}
        messages={messages}
        inputText={inputText}
        setInputText={setInputText}
        meshStatus={meshStatus}
        addMessage={addMessage}
        addDebugInfo={addDebugInfo}
      />
    </SafeAreaView>
  );
}