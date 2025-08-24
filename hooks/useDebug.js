import { useState } from 'react';

export const useDebug = () => {
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebugInfo = (message) => {
    console.log('DEBUG:', message);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  return {
    debugInfo,
    addDebugInfo,
  };
};