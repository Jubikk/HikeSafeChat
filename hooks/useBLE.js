import { useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

export const useBLE = (addDebugInfo) => {
  const [manager, setManager] = useState(null);
  const [bleState, setBleState] = useState('Unknown');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  const bleManagerRef = useRef(null);
  const stateSubscriptionRef = useRef(null);

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

  useEffect(() => {
    initializeBLE();
    return cleanup;
  }, []);

  return {
    manager,
    bleState,
    permissionsGranted,
    bleManagerRef,
    cleanup,
  };
};