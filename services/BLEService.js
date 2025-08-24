import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Linking } from 'react-native';

export class BLEService {
  constructor() {
    this.manager = null;
    this.device = null;
    this.stateSubscription = null;
  }

  async requestPermissions() {
    try {
      if (Platform.OS === 'android') {
        const apiLevel = parseInt(Platform.Version, 10);
        
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
          return true;
        }
        
        const results = await PermissionsAndroid.requestMultiple(permissions);
        
        const allGranted = Object.values(results).every(result => 
          result === PermissionsAndroid.RESULTS.GRANTED
        );
        
        return allGranted;
      }
      
      return true;
      
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  async initialize() {
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Permissions not granted');
    }
    
    this.manager = new BleManager();
    return this.manager;
  }

  onStateChange(callback) {
    if (this.manager) {
      this.stateSubscription = this.manager.onStateChange(callback, true);
      return this.stateSubscription;
    }
    return null;
  }

  startScan(onDeviceFound, onError) {
    if (!this.manager) {
      throw new Error('BLE manager not initialized');
    }

    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        onError(error);
        return;
      }
      
      if (device && device.id) {
        onDeviceFound(device);
      }
    });
  }

  stopScan() {
    if (this.manager) {
      this.manager.stopDeviceScan();
    }
  }

  async connect(deviceId) {
    if (!this.manager) {
      throw new Error('BLE manager not initialized');
    }

    const device = await this.manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();
    this.device = device;
    
    return device;
  }

  async disconnect() {
    if (this.device) {
      await this.device.cancelConnection();
      this.device = null;
    }
  }

  destroy() {
    try {
      if (this.stateSubscription) {
        this.stateSubscription.remove();
        this.stateSubscription = null;
      }

      if (this.device) {
        this.device.cancelConnection();
        this.device = null;
      }

      if (this.manager) {
        this.manager.destroy();
        this.manager = null;
      }
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  }
}

export default BLEService;