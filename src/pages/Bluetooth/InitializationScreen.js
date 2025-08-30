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
    backgroundColor: '#2c3e50',
  },
  initText: {
    color: '#ecf0f1',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  initSubtext: {
    color: '#bdc3c7',
    fontSize: 16,
    marginBottom: 20,
  },
  warningText: {
    color: '#e74c3c',
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3498db',
    borderRadius: 8,
    elevation: 2,
  },
  settingsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    width: '100%',
    maxHeight: 150,
  },
  debugTitle: {
    color: '#ecf0f1',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    color: '#bdc3c7',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default InitializationScreen;
