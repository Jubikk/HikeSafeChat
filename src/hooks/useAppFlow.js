import { useState } from 'react';
import { insertUserData } from '../database/database';

export const useAppFlow = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showChannel, setShowChannel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [inputText, setInputText] = useState('');
  const [availableDevices, setAvailableDevices] = useState([]);

  // Onboarding completion
  const handleOnboardingComplete = async (userData) => {
    try {
      await insertUserData(userData);
      setShowOnboarding(false);
      setShowLogin(true);
      console.log('Onboarding completed');
    } catch (err) {
      console.error('Failed to save onboarding data', err);
    }
  };

  // Login completion - go directly to dashboard
  const handleLoginComplete = async (userData) => {
    try {
      if (userData) {
        await insertUserData(userData);
      }
      setShowLogin(false);
      setShowDashboard(true);
      setShowUserInfo(false);
      console.log('Login completed, showing dashboard');
    } catch (err) {
      console.error('Failed to save login data', err);
    }
  };

  // UserInfo completion - return to dashboard
  const handleUserInfoComplete = () => {
    console.log('UserInfo completed');
    setShowUserInfo(false);
    setShowDashboard(true);
  };

  // Helper function to reset all screen states
  const resetAllScreenStates = () => {
    setShowDashboard(false);
    setShowUserInfo(false);
    setShowChannel(false);
    setShowHistory(false);
    setShowMap(false);
    setShowMessaging(false);
  };

  // Navigation functions for each screen
  const navigateToDashboard = () => {
    resetAllScreenStates();
    setShowDashboard(true);
  };

  const navigateToUserInfo = () => {
    resetAllScreenStates();
    setShowUserInfo(true);
  };

  const navigateToChannel = () => {
    resetAllScreenStates();
    setShowChannel(true);
  };

  const navigateToHistory = () => {
    resetAllScreenStates();
    setShowHistory(true);
  };

  const navigateToMap = () => {
    resetAllScreenStates();
    setShowMap(true);
  };

  const navigateToMessaging = () => {
    resetAllScreenStates();
    setShowMessaging(true);
  };

  // Generic navigation handler
  const navigateToScreen = (screen) => {
    // Reset all screen states first
    setShowDashboard(false);
    setShowUserInfo(false);
    setShowChannel(false);
    setShowHistory(false);
    setShowMap(false);
    setShowMessaging(false);

    // Set the requested screen
    switch (screen) {
      case 'dashboard':
        setShowDashboard(true);
        break;
      case 'userInfo':
        setShowUserInfo(true);
        break;
      case 'channel':
        setShowChannel(true);
        break;
      case 'history':
        setShowHistory(true);
        break;
      case 'map':
        setShowMap(true);
        break;
      case 'messaging':
        setShowMessaging(true);
        break;
      default:
        console.warn(`Unknown screen: ${screen}`);
        setShowDashboard(true);
    }
  };

  // Reset all navigation states (useful for BLE mode)
  const resetNavigationStates = () => {
    setShowOnboarding(false);
    setShowLogin(false);
    setShowUserInfo(false);
    setShowDashboard(false);
    setShowChannel(false);
    setShowHistory(false);
    setShowMap(false);
    setShowMessaging(false);
  };

  return {
    // State flags
    showOnboarding,
    showLogin,
    showUserInfo,
    showDashboard,
    showChannel,
    showHistory,
    showMap,
    
    // Other states
    isScanning,
    setIsScanning,
    inputText,
    setInputText,
    availableDevices,
    setAvailableDevices,
    
    // Completion handlers
    handleOnboardingComplete,
    handleLoginComplete,
    handleUserInfoComplete,
    
    // Navigation functions
    navigateToDashboard,
    navigateToUserInfo,
    navigateToChannel,
    navigateToHistory,
    navigateToMap,
    navigateToScreen,
    
    // Manual navigation (legacy)
    setShowDashboard,
    setShowUserInfo,
    setShowChannel,
    setShowHistory,
    setShowMap,
    
    // State setters (for direct manipulation if needed)
    setShowOnboarding,
    setShowLogin,
    resetNavigationStates,
  };
};