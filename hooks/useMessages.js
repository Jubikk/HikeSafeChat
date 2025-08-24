import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

export const useMessages = (addDebugInfo) => {
  const [messages, setMessages] = useState([]);

  const loadStoredData = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        setMessages(Array.isArray(parsedMessages) ? parsedMessages : []);
      }

      const lastDeviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE);
      if (lastDeviceId) {
        addDebugInfo(`Last device found: ${lastDeviceId.substring(0, 8)}...`);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
      addDebugInfo(`Error loading stored data: ${error.message}`);
    }
  };

  const saveMessages = async (newMessages) => {
    try {
      if (Array.isArray(newMessages)) {
        await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(newMessages));
      }
    } catch (error) {
      console.error('Error saving messages:', error);
      addDebugInfo(`Error saving messages: ${error.message}`);
    }
  };

  const addMessage = (message) => {
    if (!message || typeof message !== 'object') {
      addDebugInfo('Invalid message object');
      return;
    }

    const newMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...message,
    };
    
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, newMessage];
      saveMessages(updatedMessages);
      return updatedMessages;
    });
  };

  const clearMessages = async () => {
    setMessages([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.MESSAGES);
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  };

  useEffect(() => {
    loadStoredData();
  }, []);

  return {
    messages,
    setMessages,
    addMessage,
    clearMessages,
  };
};