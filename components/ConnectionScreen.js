import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BLE_CONFIG, STORAGE_KEYS } from '../config/constants';
import DeviceItem from './DeviceItem';

const ConnectionScreen = ({
  bleState,
  isScanning,
  setIsScanning,
  availableDevices,
  setAvailableDevices,
  debugInfo,
  messages,
  setMessages,
  setDevice,
  setIsConnected,
  setMeshStatus,
  addDebugInfo,
  addMessage,
  bleManagerRef,
}) => {
  const scanTimeoutRef = useRef(null);

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
      }, BLE_CONFIG.SCAN_TIMEOUT);

    } catch (error) {
      addDebugInfo(`Scan start error: ${error.message}`);
      setIsScanning(false);
      Alert.alert('Scan Error', 'Failed to start BLE scan: ' + error.message);
    }
  };

  const setupNotifications = async (connectedDevice) => {
    try {
      addDebugInfo('Setting up notifications...');
      
      await connectedDevice.monitorCharacteristicForService(
        BLE_CONFIG.SERVICE_UUID,
        BLE_CONFIG.MESH_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            addDebugInfo(`Notification error: ${error.message}`);
            return;
          }

          if (characteristic?.value) {
            try {
              let jsonString;
              
              try {
                jsonString = atob(characteristic.value);
              } catch (e) {
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

      const connectedDevice = await bleManagerRef.current.connectToDevice(deviceId);
      addDebugInfo(`Connected to: ${connectedDevice.name || 'Unknown'}`);

      await connectedDevice.discoverAllServicesAndCharacteristics();
      addDebugInfo('Services discovered');

      setDevice(connectedDevice);
      setIsConnected(true);

      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE, deviceId);
      await setupNotifications(connectedDevice);

      addMessage({
        type: 'system',
        text: `Connected to ${connectedDevice.name || deviceId.substring(0, 8)}`,
        sender: 'system',
      });

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
              await AsyncStorage.removeItem(STORAGE_KEYS.MESSAGES);
            } catch (error) {
              console.error('Error clearing messages:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.connectionContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HikeSafe Mesh</Text>
        <Text style={styles.headerSubtitle}>Offline Emergency Chat</Text>
      </View>

      <View style={styles.content}>
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
              renderItem={({ item }) => (
                <DeviceItem 
                  device={item} 
                  onConnect={() => connectToDevice(item.id)} 
                />
              )}
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
    </View>
  );
};

const styles = StyleSheet.create({
  connectionContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2c3e50',
    padding: 16,
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
  content: {
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
  debugContainer: {
    backgroundColor: '#2c3e50',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  debugText: {
    color: '#95a5a6',
    fontSize: 10,
    fontFamily: 'monospace',
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
});

export default ConnectionScreen;