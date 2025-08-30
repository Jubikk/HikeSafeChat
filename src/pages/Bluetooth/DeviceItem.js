import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const DeviceItem = ({ device, onConnect }) => {
  if (!device || !device.id) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={onConnect}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{device.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>ID: {device.id.substring(0, 16)}...</Text>
        {device.serviceUUIDs && device.serviceUUIDs.length > 0 && (
          <Text style={styles.deviceServices}>
            Services: {device.serviceUUIDs.length}
          </Text>
        )}
      </View>
      <Text style={styles.deviceRssi}>{device.rssi || -100} dBm</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  deviceItem: {
    backgroundColor: '#2c3e50',
    padding: 12,
    borderRadius: 8,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deviceId: {
    color: '#bdc3c7',
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  deviceServices: {
    color: '#7f8c8d',
    fontSize: 12,
  },
  deviceRssi: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default DeviceItem;
