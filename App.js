import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  StatusBar,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';

// BLE Configuration
const SERVICE_UUID = "12345678-1234-1234-1234-123456789abc";
const SEND_CHAR_UUID = "11111111-2222-3333-4444-555555555555";
const MESH_CHAR_UUID = "87654321-4321-4321-4321-cba987654321";

const STORAGE_KEY = '@HikeSafe:messages';
const DEVICE_KEY = '@HikeSafe:lastDevice';

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
  const flatListRef = useRef(null);
  const scanTimeoutRef = useRef(null);
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

  // Cleanup function to prevent memory leaks
  const cleanup = () => {
    try {
      addDebugInfo('Starting cleanup...');
      
      // Clear scan timeout
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }

      // Stop scanning
      if (bleManagerRef.current) {
        try {
          bleManagerRef.current.stopDeviceScan();
        } catch (e) {
          console.warn('Error stopping scan:', e);
        }
      }

      // Remove state subscription
      if (stateSubscriptionRef.current) {
        try {
          stateSubscriptionRef.current.remove();
          stateSubscriptionRef.current = null;
        } catch (e) {
          console.warn('Error removing subscription:', e);
        }
      }

      // Disconnect device
      if (device && isConnected) {
        try {
          device.cancelConnection();
        } catch (e) {
          console.warn('Error disconnecting device:', e);
        }
      }

      // Destroy manager
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
      
      // Request permissions first
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
      
      // Create BLE manager
      const bleManager = new BleManager();
      setManager(bleManager);
      bleManagerRef.current = bleManager;
      
      // Monitor BLE state
      const subscription = bleManager.onStateChange((state) => {
        addDebugInfo(`BLE State changed: ${state}`);
        setBleState(state);
        
        if (state === 'PoweredOn') {
          addDebugInfo('BLE is ready for scanning');
          setPermissionsGranted(true);
        } else if (state === 'PoweredOff') {
          setPermissionsGranted(false);
          // Don't show alert immediately, user might be turning it back on
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
        
        if (apiLevel >= 31) { // Android 12+
          permissions = [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ];
        } else if (apiLevel >= 23) { // Android 6+
          permissions = [
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
          ];
        } else {
          // Older Android versions don't need runtime permissions
          addDebugInfo('Old Android version, no runtime permissions needed');
          return true;
        }
        
        addDebugInfo(`Requesting permissions: ${permissions.join(', ')}`);
        
        const results = await PermissionsAndroid.requestMultiple(permissions);
        
        // Log individual permission results
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
      
      // iOS permissions handled via Info.plist
      addDebugInfo('iOS - permissions handled via Info.plist');
      return true;
      
    } catch (error) {
      addDebugInfo(`Permission request error: ${error.message}`);
      return false;
    }
  };

  const loadStoredData = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        setMessages(Array.isArray(parsedMessages) ? parsedMessages : []);
      }

      const lastDeviceId = await AsyncStorage.getItem(DEVICE_KEY);
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
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
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

    // Use setTimeout to ensure the message is added before scrolling
    setTimeout(() => {
      if (flatListRef.current) {
        try {
          flatListRef.current.scrollToEnd({ animated: true });
        } catch (e) {
          console.warn('Error scrolling to end:', e);
        }
      }
    }, 100);
  };

  const scanForDevices = async () => {
    if (!bleManagerRef.current) {
      addDebugInfo('BLE manager not ready');
      Alert.alert('BLE Not Ready', 'Bluetooth manager is not initialized yet.');
      return;
    }

    if (bleState !== 'PoweredOn') {
      addDebugInfo(`BLE state not ready: ${bleState}`);
      Alert.alert('Bluetooth Not Ready', `Bluetooth state: ${bleState}. Please ensure Bluetooth is turned on.`);
      return;
    }

    if (isScanning) {
      addDebugInfo('Already scanning');
      return;
    }

    setIsScanning(true);
    setAvailableDevices([]);
    addDebugInfo('Starting BLE scan...');

    try {
      // Clear any existing scan
      bleManagerRef.current.stopDeviceScan();

      let deviceCount = 0;

      bleManagerRef.current.startDeviceScan(null, null, (error, scannedDevice) => {
        if (error) {
          addDebugInfo(`Scan error: ${error.message}`);
          setIsScanning(false);
          Alert.alert('Scan Error', `Scan failed: ${error.message}`);
          return;
        }

        if (scannedDevice && scannedDevice.id) {
          deviceCount++;
          addDebugInfo(`Found device ${deviceCount}: ${scannedDevice.name || 'Unknown'} (${scannedDevice.id.substring(0, 8)}...)`);

          // Add all devices (with or without names) for debugging
          setAvailableDevices(prevDevices => {
            const exists = prevDevices.find(d => d.id === scannedDevice.id);
            if (!exists) {
              return [...prevDevices, {
                id: scannedDevice.id,
                name: scannedDevice.name || 'Unknown Device',
                rssi: scannedDevice.rssi || -100,
                serviceUUIDs: scannedDevice.serviceUUIDs || [],
              }];
            }
            return prevDevices;
          });
        }
      });

      // Stop scanning after 15 seconds
      scanTimeoutRef.current = setTimeout(() => {
        if (bleManagerRef.current) {
          try {
            bleManagerRef.current.stopDeviceScan();
          } catch (e) {
            console.warn('Error stopping scan:', e);
          }
        }
        setIsScanning(false);
        addDebugInfo(`Scan completed. Found ${deviceCount} devices.`);
        
        if (deviceCount === 0) {
          Alert.alert(
            'No Devices Found',
            'No BLE devices were discovered. Make sure:\n\n• Your mesh device is powered on\n• Bluetooth is enabled\n• Location services are enabled\n• You\'re close to the device',
            [{ text: 'OK' }]
          );
        }
        scanTimeoutRef.current = null;
      }, 15000);

    } catch (error) {
      addDebugInfo(`Scan start error: ${error.message}`);
      setIsScanning(false);
      Alert.alert('Scan Error', 'Failed to start BLE scan: ' + error.message);
    }
  };

  const connectToDevice = async (deviceId) => {
    if (!bleManagerRef.current) {
      Alert.alert('BLE Not Ready', 'Bluetooth manager is not initialized.');
      return;
    }

    if (!deviceId || typeof deviceId !== 'string') {
      Alert.alert('Invalid Device', 'Device ID is invalid.');
      return;
    }

    try {
      addDebugInfo(`Connecting to: ${deviceId.substring(0, 8)}...`);
      
      // Disconnect existing device first
      if (device && isConnected) {
        try {
          await device.cancelConnection();
        } catch (e) {
          console.warn('Error disconnecting existing device:', e);
        }
      }

      const connectedDevice = await bleManagerRef.current.connectToDevice(deviceId);
      addDebugInfo(`Connected to: ${connectedDevice.name || 'Unknown'}`);

      await connectedDevice.discoverAllServicesAndCharacteristics();
      addDebugInfo('Services discovered');

      setDevice(connectedDevice);
      setIsConnected(true);

      await AsyncStorage.setItem(DEVICE_KEY, deviceId);
      await setupNotifications(connectedDevice);

      addMessage({
        type: 'system',
        text: `Connected to ${connectedDevice.name || deviceId.substring(0, 8)}`,
        sender: 'system',
      });

      // Set up disconnection handler
      const disconnectionSubscription = connectedDevice.onDisconnected((error, disconnectedDevice) => {
        addDebugInfo(`Disconnected: ${error?.message || 'Unknown reason'}`);
        setIsConnected(false);
        setDevice(null);
        addMessage({
          type: 'system',
          text: 'Disconnected from mesh network',
          sender: 'system',
        });
      });

    } catch (error) {
      addDebugInfo(`Connection failed: ${error.message}`);
      Alert.alert('Connection Failed', `Could not connect to device: ${error.message}`);
      setIsConnected(false);
      setDevice(null);
    }
  };

  const setupNotifications = async (connectedDevice) => {
    try {
      addDebugInfo('Setting up notifications...');
      
      await connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        MESH_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            addDebugInfo(`Notification error: ${error.message}`);
            return;
          }

          if (characteristic?.value) {
            try {
              let jsonString;
              
              // Handle base64 decoding more safely
              try {
                jsonString = atob(characteristic.value);
              } catch (e) {
                // Fallback: try to parse as hex
                try {
                  const bytes = characteristic.value.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16));
                  if (bytes && bytes.every(b => !isNaN(b) && b >= 0 && b <= 255)) {
                    jsonString = String.fromCharCode(...bytes);
                  } else {
                    jsonString = characteristic.value;
                  }
                } catch (e2) {
                  jsonString = characteristic.value;
                }
              }

              const meshData = JSON.parse(jsonString);
              addDebugInfo(`Mesh update: ${meshData.nodeCount || 0} nodes`);
              
              setMeshStatus(meshData);

              if (meshData.recentMessages && Array.isArray(meshData.recentMessages)) {
                meshData.recentMessages.forEach(msg => {
                  if (msg && msg.sender && msg.content && msg.sender !== meshData.nodeId) {
                    // Check for duplicate messages more carefully
                    const messageExists = messages.some(existingMsg => 
                      existingMsg.text === msg.content && 
                      existingMsg.sender === msg.sender &&
                      msg.timestamp && existingMsg.timestamp &&
                      Math.abs(new Date(existingMsg.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 5000
                    );
                    
                    if (!messageExists) {
                      addMessage({
                        type: 'received',
                        text: msg.content,
                        sender: msg.sender,
                        rssi: msg.rssi,
                      });
                    }
                  }
                });
              }

            } catch (parseError) {
              addDebugInfo(`Parse error: ${parseError.message}`);
            }
          }
        }
      );

      addDebugInfo('Notifications setup complete');
    } catch (error) {
      addDebugInfo(`Notification setup failed: ${error.message}`);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !device || !isConnected) {
      return;
    }

    const messageText = inputText.trim();
    setInputText('');

    try {
      addDebugInfo(`Sending: ${messageText.substring(0, 20)}...`);

      // Safely encode message
      let base64Message;
      try {
        const messageBytes = new TextEncoder().encode(messageText);
        base64Message = btoa(String.fromCharCode(...messageBytes));
      } catch (e) {
        // Fallback encoding
        base64Message = btoa(messageText);
      }

      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        SEND_CHAR_UUID,
        base64Message
      );

      addMessage({
        type: 'sent',
        text: messageText,
        sender: 'me',
      });

      addDebugInfo('Message sent successfully');

    } catch (error) {
      addDebugInfo(`Send failed: ${error.message}`);
      Alert.alert('Send Error', `Failed to send message: ${error.message}`);
      
      addMessage({
        type: 'error',
        text: `Failed to send: ${messageText}`,
        sender: 'system',
      });
    }
  };

  const disconnect = async () => {
    if (device && isConnected) {
      try {
        await device.cancelConnection();
        setDevice(null);
        setIsConnected(false);
        addMessage({
          type: 'system',
          text: 'Disconnected from mesh network',
          sender: 'system',
        });
      } catch (error) {
        console.error('Disconnect error:', error);
        addDebugInfo(`Disconnect error: ${error.message}`);
      }
    }
  };

  const clearMessages = async () => {
    Alert.alert(
      'Clear Messages',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setMessages([]);
            try {
              await AsyncStorage.removeItem(STORAGE_KEY);
            } catch (error) {
              console.error('Error clearing messages:', error);
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }) => {
    if (!item || !item.id) {
      return null;
    }

    const isSystem = item.type === 'system';
    const isSent = item.type === 'sent';
    const isError = item.type === 'error';
    const isReceived = item.type === 'received';

    return (
      <View style={[
        styles.messageContainer,
        isSent && styles.sentMessage,
        isSystem && styles.systemMessage,
        isError && styles.errorMessage,
      ]}>
        <View style={[
          styles.messageContent,
          isSent && styles.sentMessageContent,
          isSystem && styles.systemMessageContent,
          isError && styles.errorMessageContent,
        ]}>
          {(isReceived || isError) && item.sender && (
            <Text style={styles.senderText}>
              {item.sender}
              {item.rssi && ` (${item.rssi} dBm)`}
            </Text>
          )}
          <Text style={[
            styles.messageText,
            isSent && styles.sentMessageText,
            isSystem && styles.systemMessageText,
            isError && styles.errorMessageText,
          ]}>
            {item.text || ''}
          </Text>
          <Text style={[
            styles.timestampText,
            isSent && styles.sentTimestampText,
          ]}>
            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}
          </Text>
        </View>
      </View>
    );
  };

  const renderDeviceItem = ({ item }) => {
    if (!item || !item.id) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.deviceItem}
        onPress={() => connectToDevice(item.id)}
      >
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
          <Text style={styles.deviceId}>ID: {item.id.substring(0, 16)}...</Text>
          {item.serviceUUIDs && item.serviceUUIDs.length > 0 && (
            <Text style={styles.deviceServices}>
              Services: {item.serviceUUIDs.length}
            </Text>
          )}
        </View>
        <Text style={styles.deviceRssi}>{item.rssi || -100} dBm</Text>
      </TouchableOpacity>
    );
  };

  // Show initialization screen while BLE is setting up
  if (!manager || !permissionsGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
        <View style={styles.initContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.initText}>Initializing Bluetooth...</Text>
          <Text style={styles.initSubtext}>BLE State: {bleState}</Text>
          
          {/* Debug info */}
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            {debugInfo.map((info, index) => (
              <Text key={index} style={styles.debugText}>{info}</Text>
            ))}
          </View>
          
          {bleState === 'PoweredOff' && (
            <Text style={styles.warningText}>Please turn on Bluetooth</Text>
          )}
          
          {bleState === 'Unauthorized' && (
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.settingsButtonText}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>HikeSafe Mesh</Text>
          <Text style={styles.headerSubtitle}>Offline Emergency Chat</Text>
        </View>

        <View style={styles.connectionContainer}>
          <Text style={styles.connectionTitle}>Connect to Mesh Network</Text>
          <Text style={styles.bleStatus}>Bluetooth: {bleState}</Text>
          
          {/* Debug info */}
          <View style={styles.debugContainer}>
            {debugInfo.slice(-3).map((info, index) => (
              <Text key={index} style={styles.debugText}>{info}</Text>
            ))}
          </View>
          
          <TouchableOpacity
            style={[styles.scanButton, (isScanning || bleState !== 'PoweredOn') && styles.scanButtonDisabled]}
            onPress={scanForDevices}
            disabled={isScanning || bleState !== 'PoweredOn'}
          >
            {isScanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.scanButtonText}>
                {bleState === 'PoweredOn' ? 'Scan for Devices' : 'Bluetooth Not Ready'}
              </Text>
            )}
          </TouchableOpacity>

          {availableDevices.length > 0 && (
            <View style={styles.devicesContainer}>
              <Text style={styles.devicesTitle}>Available Devices ({availableDevices.length}):</Text>
              <FlatList
                data={availableDevices}
                renderItem={renderDeviceItem}
                keyExtractor={(item) => item?.id || Math.random().toString()}
                style={styles.devicesList}
              />
            </View>
          )}

          {messages.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearMessages}>
              <Text style={styles.clearButtonText}>Clear Message History</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>HikeSafe Mesh</Text>
          <Text style={styles.headerSubtitle}>
            {meshStatus ? `${meshStatus.nodeCount || 0} nodes` : 'Connected'}
          </Text>
        </View>
        <TouchableOpacity onPress={disconnect} style={styles.disconnectButton}>
          <Text style={styles.disconnectButtonText}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      {meshStatus && (
        <View style={styles.meshStatus}>
          <Text style={styles.meshStatusText}>
            Node: {meshStatus.nodeId?.substring(0, 8) || 'Unknown'}... | 
            Uptime: {Math.floor((meshStatus.uptime || 0) / 60)}m | 
            Nodes: {meshStatus.nodeCount || 0} |
            Msgs: {meshStatus.totalReceived || 0}/{meshStatus.totalSent || 0}
          </Text> 
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item?.id || Math.random().toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => {
          if (flatListRef.current) {
            try {
              flatListRef.current.scrollToEnd({ animated: true });
            } catch (e) {
              console.warn('Error scrolling to end:', e);
            }
          }
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type emergency message..."
          placeholderTextColor="#95a5a6"
          multiline
          maxLength={200}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495e',
  },
  initContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  initText: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  initSubtext: {
    color: '#bdc3c7',
    fontSize: 14,
    marginTop: 10,
  },
  warningText: {
    color: '#e74c3c',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  debugContainer: {
    backgroundColor: '#2c3e50',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    maxWidth: '90%',
  },
  debugTitle: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    color: '#95a5a6',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  settingsButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#2c3e50',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ecf0f1',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#bdc3c7',
    fontSize: 14,
  },
  disconnectButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  meshStatus: {
    backgroundColor: '#27ae60',
    padding: 8,
  },
  meshStatusText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  connectionContainer: {
    flex: 1,
    padding: 20,
  },
  connectionTitle: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  bleStatus: {
    color: '#3498db',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  scanButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButtonDisabled: {
    backgroundColor: '#7f8c8d',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  devicesContainer: {
    flex: 1,
  },
  devicesTitle: {
    color: '#ecf0f1',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  devicesList: {
    flex: 1,
  },
  deviceItem: {
    backgroundColor: '#2c3e50',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: '#ecf0f1',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deviceId: {
    color: '#95a5a6',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  deviceServices: {
    color: '#3498db',
    fontSize: 10,
  },
  deviceRssi: {
    color: '#27ae60',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 6,
    marginTop: 20,
  },
  clearButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
    alignSelf: 'flex-start',
    maxWidth: width * 0.8,
  },
  sentMessage: {
    alignSelf: 'flex-end',
  },
  systemMessage: {
    alignSelf: 'center',
  },
  errorMessage: {
    alignSelf: 'flex-end',
  },
  messageContent: {
    backgroundColor: '#2c3e50',
    padding: 12,
    borderRadius: 12,
    borderBottomLeftRadius: 4,
  },
  sentMessageContent: {
    backgroundColor: '#3498db',
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 12,
  },
  systemMessageContent: {
    backgroundColor: '#7f8c8d',
    borderRadius: 12,
  },
  errorMessageContent: {
    backgroundColor: '#e74c3c',
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 12,
  },
  messageText: {
    color: '#ecf0f1',
    fontSize: 16,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#fff',
  },
  systemMessageText: {
    color: '#ecf0f1',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorMessageText: {
    color: '#fff',
  },
  senderText: {
    color: '#95a5a6',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  timestampText: {
    color: '#7f8c8d',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  sentTimestampText: {
    color: '#bdc3c7',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#2c3e50',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#34495e',
    color: '#ecf0f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#7f8c8d',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});