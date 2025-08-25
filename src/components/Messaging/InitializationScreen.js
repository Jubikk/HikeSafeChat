import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const InitializationScreen = ({ bleState, debugInfo, onOpenSettings }) => {
  return (
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
          onPress={onOpenSettings}
        >
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default InitializationScreen;