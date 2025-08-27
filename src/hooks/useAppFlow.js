// src/hooks/useAppFlow.js - App Flow Management
import { useState } from 'react';
import { insertUserData } from '../database/database';

export const useAppFlow = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [inputText, setInputText] = useState('');
  const [availableDevices, setAvailableDevices] = useState([]);

  // Handle onboarding completion
  const handleOnboardingComplete = async (userData) => {
    try {
      await insertUserData(userData);
      console.log('User data saved ✅');
      setShowOnboarding(false);
      setShowLogin(true);
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  };

  // Handle login completion
  const handleLoginComplete = async (userData) => {
    try {
      await insertUserData(userData);
      console.log('User data saved ✅');
      setShowLogin(false);
      setShowUserInfo(true);
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  };

  // Handle UserInfo completion
  const handleUserInfoComplete = () => {
    setShowUserInfo(false);
  };

  return {
    showOnboarding,
    showLogin,
    showUserInfo,
    isScanning,
    setIsScanning,
    inputText,
    setInputText,
    availableDevices,
    setAvailableDevices,
    handleOnboardingComplete,
    handleLoginComplete,
    handleUserInfoComplete,
  };
};