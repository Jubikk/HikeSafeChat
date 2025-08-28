import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const BottomNavBar = ({ activeTab, onTabPress, onNavigate }) => {
  const tabs = [
    { id: 'home', icon: 'home-outline', activeIcon: 'home', screen: 'dashboard' },
    { id: 'channel', icon: 'globe-outline', activeIcon: 'globe', screen: 'channel' },
    { id: 'history', icon: 'cloud-upload-outline', activeIcon: 'cloud-upload', screen: 'history' },
    { id: 'map', icon: 'location-outline', activeIcon: 'location', screen: 'map' },
    { id: 'profile', icon: 'person-outline', activeIcon: 'person', screen: 'userInfo' },
  ];

  const handleTabPress = (tab) => {
    if (onTabPress) onTabPress(tab.id);
    if (onNavigate) onNavigate(tab.screen);
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tabButton}
          onPress={() => handleTabPress(tab)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === tab.id ? tab.activeIcon : tab.icon}
            size={28}
            color={activeTab === tab.id ? '#4A90E2' : '#666'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
});

export default BottomNavBar;