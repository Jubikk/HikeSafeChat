import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomNavBar from '../components/navbar/bottomNavBar';

const Channel = ({ currentScreen, onNavigate }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>This is channel</Text>
      </View>
      <BottomNavBar
        activeTab={currentScreen}
        onNavigate={onNavigate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default Channel;