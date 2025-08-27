// src/providers/AppProvider.js - Context Provider
import React, { createContext, useContext, useEffect } from 'react';
import { useBLE } from '../hooks/useBLE';
import { useMessages } from '../hooks/useMessages';
import { useDebug } from '../hooks/useDebug';
import { useDeviceConnection } from '../hooks/useDeviceConnection';
import { useAppFlow } from '../hooks/useAppFlow';
import { initDB } from '../database/database';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export default function AppProvider({ children }) {
  // Initialize database once at startup
  useEffect(() => {
    initDB();
  }, []);

  // Custom hooks
  const { debugInfo, addDebugInfo } = useDebug();
  const { manager, bleState, permissionsGranted, bleManagerRef, cleanup } = useBLE(addDebugInfo);
  const { messages, setMessages, addMessage, clearMessages } = useMessages(addDebugInfo);
  const { 
    device, 
    isConnected, 
    meshStatus, 
    setDevice, 
    setIsConnected, 
    setMeshStatus, 
    connectToDevice, 
    disconnect 
  } = useDeviceConnection(bleManagerRef, addDebugInfo, addMessage);
  
  const appFlowState = useAppFlow();

  const value = {
    // BLE related
    manager,
    bleState,
    permissionsGranted,
    bleManagerRef,
    cleanup,
    
    // Debug
    debugInfo,
    addDebugInfo,
    
    // Messages
    messages,
    setMessages,
    addMessage,
    clearMessages,
    
    // Device Connection
    device,
    isConnected,
    meshStatus,
    setDevice,
    setIsConnected,
    setMeshStatus,
    connectToDevice,
    disconnect,
    
    // App Flow
    ...appFlowState,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}