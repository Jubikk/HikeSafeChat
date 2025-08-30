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
import { BLE_CONFIG } from '../../config/constants';
import DeviceItem from './DeviceItem';

const ConnectionScreen = ({
  bleState,
  isScanning,
  setIsScanning,
  availableDevices,
  setAvailableDevices,
  debugInfo,
  messages,
  connectToDevice,
  clearMessages,
  bleManagerRef,
  addDebugInfo,
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
      bleManagerRef.current.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            addDebugInfo(`Scan error: ${error.message}`);
            console.error('Scan error:', error);
            setIsScanning(false);
            return;
          }
          if (device) {
            setAvailableDevices(prevDevices => {
              const exists = prevDevices.some(d => d.id === device.id);
              return exists ? prevDevices : [...prevDevices, device];
            });
          }
        }
      );

      // Stop scanning after timeout
      scanTimeoutRef.current = setTimeout(() => {
        stopScan();
      }, BLE_CONFIG.SCAN_TIMEOUT);

    } catch (error) {
      addDebugInfo(`Scan error: ${error.message}`);
      console.error('Scan error:', error);
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    if (bleManagerRef.current) {
      bleManagerRef.current.stopDeviceScan();
    }
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    setIsScanning(false);
    addDebugInfo('BLE scan stopped');
  };

  const renderDeviceItem = ({ item }) => (
    <DeviceItem
      device={item}
      onPress={() => connectToDevice(item)}
    />
  );

  return (
    <View style={styles.connectionContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Devices</Text>
        <TouchableOpacity
          style={[styles.button, isScanning && styles.buttonDisabled]}
          onPress={isScanning ? stopScan : scanForDevices}
          disabled={isScanning}
        >
          <Text style={styles.buttonText}>
            {isScanning ? 'Stop Scan' : 'Scan for Devices'}
          </Text>
        </TouchableOpacity>
      </View>

      {isScanning ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BLE_CONFIG.COLORS.primary} />
          <Text style={styles.loadingText}>Scanning for devices...</Text>
        </View>
      ) : availableDevices.length > 0 ? (
        <FlatList
          data={availableDevices}
          renderItem={renderDeviceItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.deviceList}
        />
      ) : (
        <View style={styles.noDevicesContainer}>
          <Text style={styles.noDevicesText}>No devices found</Text>
          <Text style={styles.hintText}>
            Make sure your device is powered on and in range
          </Text>
        </View>
      )}

      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText} numberOfLines={3}>
          {debugInfo}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  connectionContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    backgroundColor: BLE_CONFIG.COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  deviceList: {
    paddingBottom: 20,
  },
  noDevicesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDevicesText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  debugContainer: {
    marginTop: 'auto',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666',
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#666',
  },
});

export default ConnectionScreen;
