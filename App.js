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
} from 'react-native';
import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';

// BLE Configuration (matching your Arduino sketch)
const SERVICE_UUID = "12345678-1234-1234-1234-123456789abc";
const SEND_CHAR_UUID = "11111111-2222-3333-4444-555555555555"; // For sending messages
const MESH_CHAR_UUID = "87654321-4321-4321-4321-cba987654321"; // For receiving mesh status

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
  const flatListRef = useRef(null);

  useEffect(() => {
    initializeBLE();
    loadStoredData();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeBLE = async () => {
    try {
      console.log('Initializing BLE...');
      
      // Request permissions first
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        Alert.alert('Permissions Required', 'Bluetooth and location permissions are required for this app to work.');
        return;
      }
      
      // Create BLE manager
      const bleManager = new BleManager();
      setManager(bleManager);
      
      // Monitor BLE state
      const subscription = bleManager.onStateChange((state) => {
        console.log('BLE State:', state);
        setBleState(state);
        
        if (state === 'PoweredOn') {
          console.log('BLE is powered on and ready');
          setPermissionsGranted(true);
        } else if (state === 'PoweredOff') {
          Alert.alert('Bluetooth Off', 'Please turn on Bluetooth to use this app.');
        }
      }, true);

      return () => {
        subscription?.remove();
      };
    } catch (error) {
      console.error('BLE initialization error:', error);
      Alert.alert('BLE Error', 'Failed to initialize Bluetooth: ' + error.message);
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const apiLevel = Platform.constants.Release;
        
        if (apiLevel >= 12) {
          // Android 12+ permissions
          const permissions = [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ];
          
          const results = await PermissionsAndroid.requestMultiple(permissions);
          
          return Object.values(results).every(result => result === PermissionsAndroid.RESULTS.GRANTED);
        } else {
          // Android < 12 permissions
          const permissions = [
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
          ];
          
          const results = await PermissionsAndroid.requestMultiple(permissions);
          
          return Object.values(results).every(result => result === PermissionsAndroid.RESULTS.GRANTED);
        }
      }
      return true; // iOS permissions handled via Info.plist
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  const cleanup = () => {
    try {
      if (device && isConnected) {
        device.cancelConnection();
      }
      if (manager) {
        manager.destroy();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const loadStoredData = async () => {
    try {
      // Load message history
      const storedMessages = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }

      // Try to reconnect to last device (but don't auto-connect to avoid issues)
      const lastDeviceId = await AsyncStorage.getItem(DEVICE_KEY);
      if (lastDeviceId) {
        console.log('Last device found:', lastDeviceId);
        // You can add auto-reconnect logic here if needed
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  const saveMessages = async (newMessages) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const addMessage = (message) => {
    const newMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...message,
    };
    
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, newMessage];
      saveMessages(updatedMessages);
      return updatedMessages;
    });

    // Auto-scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const scanForDevices = async () => {
    if (!manager) {
      Alert.alert('BLE Not Ready', 'Bluetooth is not initialized yet. Please wait and try again.');
      return;
    }

    if (bleState !== 'PoweredOn') {
      Alert.alert('Bluetooth Off', 'Please turn on Bluetooth and try again.');
      return;
    }

    if (isScanning) return;

    setIsScanning(true);
    setAvailableDevices([]);
    console.log('Starting BLE scan...');

    try {
      // Clear any existing scan
      manager.stopDeviceScan();

      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          setIsScanning(false);
          Alert.alert('Scan Error', error.message);
          return;
        }

        if (device && device.name && device.name.startsWith('LoRaMesh_')) {
          console.log('Found HikeSafe device:', device.name, device.id);
          
          setAvailableDevices(prevDevices => {
            const exists = prevDevices.find(d => d.id === device.id);
            if (!exists) {
              return [...prevDevices, {
                id: device.id,
                name: device.name,
                rssi: device.rssi,
              }];
            }
            return prevDevices;
          });
        }
      });

      // Stop scanning after 10 seconds
      setTimeout(() => {
        if (manager) {
          manager.stopDeviceScan();
        }
        setIsScanning(false);
        console.log('Scan completed');
      }, 10000);

    } catch (error) {
      console.error('Failed to start scan:', error);
      setIsScanning(false);
      Alert.alert('Scan Error', 'Failed to start BLE scan: ' + error.message);
    }
  };

  const connectToDevice = async (deviceId) => {
    if (!manager) {
      Alert.alert('BLE Not Ready', 'Bluetooth manager is not initialized.');
      return;
    }

    try {
      console.log('Connecting to device:', deviceId);
      
      // Disconnect if already connected
      if (device && isConnected) {
        await device.cancelConnection();
      }

      const connectedDevice = await manager.connectToDevice(deviceId);
      console.log('Connected to:', connectedDevice.name);

      // Discover services
      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log('Services discovered');

      setDevice(connectedDevice);
      setIsConnected(true);

      // Save device for future reference
      await AsyncStorage.setItem(DEVICE_KEY, deviceId);

      // Setup notifications for mesh status
      await setupNotifications(connectedDevice);

      // Add connection message
      addMessage({
        type: 'system',
        text: `Connected to ${connectedDevice.name || deviceId}`,
        sender: 'system',
      });

      // Monitor connection
      connectedDevice.onDisconnected((error, disconnectedDevice) => {
        console.log('Device disconnected:', error?.message || 'Unknown reason');
        setIsConnected(false);
        setDevice(null);
        addMessage({
          type: 'system',
          text: 'Disconnected from mesh network',
          sender: 'system',
        });
      });

    } catch (error) {
      console.error('Connection failed:', error);
      Alert.alert('Connection Failed', `Could not connect to device: ${error.message}`);
      setIsConnected(false);
      setDevice(null);
    }
  };

  const setupNotifications = async (connectedDevice) => {
    try {
      console.log('Setting up notifications...');
      
      // Subscribe to mesh status updates
      await connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        MESH_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('Notification error:', error);
            return;
          }

          if (characteristic?.value) {
            try {
              // Decode value - it might be base64 encoded or plain JSON
              let jsonString;
              try {
                // Try base64 decode first
                jsonString = atob(characteristic.value);
              } catch (e) {
                // If base64 fails, try direct conversion
                const bytes = characteristic.value.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16));
                if (bytes) {
                  jsonString = String.fromCharCode(...bytes);
                } else {
                  jsonString = characteristic.value;
                }
              }

              console.log('Raw notification data:', jsonString);
              
              const meshData = JSON.parse(jsonString);
              console.log('Mesh status update:', meshData);
              
              setMeshStatus(meshData);

              // Check for new messages in recent messages array
              if (meshData.recentMessages && Array.isArray(meshData.recentMessages)) {
                meshData.recentMessages.forEach(msg => {
                  // Only show messages from other nodes (not our own)
                  if (msg.sender && msg.sender !== meshData.nodeId) {
                    // Check if we already have this message (basic deduplication)
                    const messageExists = messages.some(existingMsg => 
                      existingMsg.text === msg.content && 
                      existingMsg.sender === msg.sender &&
                      Math.abs(new Date(existingMsg.timestamp).getTime() - msg.timestamp) < 5000
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
              console.error('Failed to parse mesh status:', parseError);
              console.log('Raw characteristic value:', characteristic.value);
            }
          }
        }
      );

      console.log('Notifications setup complete');
    } catch (error) {
      console.error('Failed to setup notifications:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !device || !isConnected) {
      return;
    }

    const messageText = inputText.trim();
    setInputText('');

    try {
      console.log('Sending message:', messageText);

      // Convert message to bytes and then to base64
      const messageBytes = new TextEncoder().encode(messageText);
      const base64Message = btoa(String.fromCharCode(...messageBytes));

      // Write to send characteristic
      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        SEND_CHAR_UUID,
        base64Message
      );

      // Add to local messages
      addMessage({
        type: 'sent',
        text: messageText,
        sender: 'me',
      });

      console.log('Message sent successfully');

    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Send Error', `Failed to send message: ${error.message}`);
      
      // Add failed message indicator
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
            await AsyncStorage.removeItem(STORAGE_KEY);
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }) => {
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
          {(isReceived || isError) && (
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
            {item.text}
          </Text>
          <Text style={[
            styles.timestampText,
            isSent && styles.sentTimestampText,
          ]}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    );
  };

  const renderDeviceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item.id)}
    >
      <View>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceId}>ID: {item.id.substring(0, 20)}...</Text>
      </View>
      <Text style={styles.deviceRssi}>{item.rssi} dBm</Text>
    </TouchableOpacity>
  );

  // Show initialization screen while BLE is setting up
  if (!manager || !permissionsGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
        <View style={styles.initContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.initText}>Initializing Bluetooth...</Text>
          <Text style={styles.initSubtext}>BLE State: {bleState}</Text>
          {bleState === 'PoweredOff' && (
            <Text style={styles.warningText}>Please turn on Bluetooth</Text>
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
              <Text style={styles.devicesTitle}>Available Devices:</Text>
              <FlatList
                data={availableDevices}
                renderItem={renderDeviceItem}
                keyExtractor={(item) => item.id}
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
            Node: {meshStatus.nodeId?.substring(0, 8)}... | 
            Uptime: {Math.floor(meshStatus.uptime / 60)}m | 
            Nodes: {meshStatus.nodeCount || 0} |
            Msgs: {meshStatus.totalReceived || 0}/{meshStatus.totalSent || 0}
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
    justifyContent: 'center',
  },
  connectionTitle: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  bleStatus: {
    color: '#3498db',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
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
    marginTop: 20,
  },
  devicesTitle: {
    color: '#ecf0f1',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  devicesList: {
    maxHeight: 200,
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
  deviceName: {
    color: '#ecf0f1',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deviceId: {
    color: '#95a5a6',
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