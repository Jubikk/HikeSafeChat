import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BLE_CONFIG, STORAGE_KEYS, MESSAGE_TYPES } from '../config/constants';

export const useDeviceConnection = (bleManagerRef, addDebugInfo, addMessage) => {
  const [device, setDevice] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [meshStatus, setMeshStatus] = useState(null);

  const setupNotifications = async (connectedDevice, messages) => {
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
                        type: MESSAGE_TYPES.RECEIVED,
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

  const connectToDevice = async (deviceId, messages) => {
    if (!bleManagerRef.current) {
      throw new Error('BLE manager not ready');
    }

    if (!deviceId || typeof deviceId !== 'string') {
      throw new Error('Invalid device ID');
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

      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE, deviceId);
      await setupNotifications(connectedDevice, messages);

      addMessage({
        type: MESSAGE_TYPES.SYSTEM,
        text: `Connected to ${connectedDevice.name || deviceId.substring(0, 8)}`,
        sender: 'system',
      });

      // Set up disconnection handler
      const disconnectionSubscription = connectedDevice.onDisconnected((error, disconnectedDevice) => {
        addDebugInfo(`Disconnected: ${error?.message || 'Unknown reason'}`);
        setIsConnected(false);
        setDevice(null);
        addMessage({
          type: MESSAGE_TYPES.SYSTEM,
          text: 'Disconnected from mesh network',
          sender: 'system',
        });
      });

      return connectedDevice;
    } catch (error) {
      addDebugInfo(`Connection failed: ${error.message}`);
      setIsConnected(false);
      setDevice(null);
      throw error;
    }
  };

  const disconnect = async () => {
    if (device && isConnected) {
      try {
        await device.cancelConnection();
        setDevice(null);
        setIsConnected(false);
        addMessage({
          type: MESSAGE_TYPES.SYSTEM,
          text: 'Disconnected from mesh network',
          sender: 'system',
        });
      } catch (error) {
        console.error('Disconnect error:', error);
        addDebugInfo(`Disconnect error: ${error.message}`);
      }
    }
  };

  return {
    device,
    isConnected,
    meshStatus,
    setDevice,
    setIsConnected,
    setMeshStatus,
    connectToDevice,
    disconnect,
  };
};