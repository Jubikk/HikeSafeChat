import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavBar from '../components/navbar/bottomNavBar';

const Dashboard = ({ onNavigate, currentScreen }) => {
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    if (currentScreen === 'dashboard') setActiveTab('home');
    else if (currentScreen === 'userInfo') setActiveTab('profile');
  }, [currentScreen]);

  // Tab press handler - fixed the navigation logic
  const handleTabPress = (tabId) => {
    console.log('Tab pressed:', tabId); // Debug log
    setActiveTab(tabId);
    
    // Map tabId to screen name and navigate
    const screenMapping = {
      'home': 'dashboard',
      'profile': 'userInfo'
    };
    
    const targetScreen = screenMapping[tabId];
    if (onNavigate && targetScreen) {
      console.log('Navigating to screen:', targetScreen); // Debug log
      onNavigate(targetScreen);
    }
  };

  // Service button component
  const ServiceButton = ({ iconName, label, badgeCount = 0, backgroundColor, onPress }) => (
    <View style={styles.serviceContainer}>
      <TouchableOpacity
        style={[styles.serviceButton, { backgroundColor }]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <Ionicons name={iconName} size={28} color="#333" />
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.serviceLabel}>{label}</Text>
    </View>
  );

  // Activity card component
  const ActivityCard = ({ index }) => (
    <TouchableOpacity
      style={styles.activityCard}
      activeOpacity={0.7}
      onPress={() => console.log(`Activity ${index + 1} pressed`)}
    >
      <Text style={styles.activityText}>Activity {index + 1}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.statusBarContainer} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.greetingCard}>
          <Text style={styles.greeting}>Hello!</Text>
          <Text style={styles.userName}>John Doe</Text>
        </View>

        {/* Lobby Info */}
        <View style={styles.lobbyCard}>
          <View style={styles.lobbyHeader}>
            <Text style={styles.lobbyIdLabel}>LOBBY ID</Text>
            <Text style={styles.batteryNote}>*Battery health of LoRa</Text>
          </View>
          <Text style={styles.lobbyId}>ABCDEF123</Text>
          <View style={styles.lobbyStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>MEMBERS</Text>
              <Text style={styles.statValue}>15</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>NEAREST</Text>
              <Text style={styles.statValue}>30 m</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>SIGNAL</Text>
              <View style={styles.signalBars}>
                <View style={[styles.signalBar, styles.signalActive]} />
                <View style={[styles.signalBar, styles.signalMedium]} />
                <View style={[styles.signalBar]} />
              </View>
            </View>
          </View>
        </View>

        {/* Services Section */}
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.servicesContainer}>
          <ServiceButton 
            iconName="people-outline" 
            label="Lobby" 
            badgeCount={0} 
            backgroundColor="#F0F0F0"
            onPress={() => console.log('Lobby pressed')}
          />
          <ServiceButton 
            iconName="chatbubble-outline" 
            label="Message" 
            badgeCount={2} 
            backgroundColor="#C8E6C9"
            onPress={() => onNavigate && onNavigate('messaging')}
          />
          <ServiceButton 
            iconName="warning-outline" 
            label="SOS Alert" 
            badgeCount={0} 
            backgroundColor="#FFCDD2"
            onPress={() => console.log('SOS Alert pressed')}
          />
          <ServiceButton 
            iconName="navigate-outline" 
            label="Compass" 
            badgeCount={1} 
            backgroundColor="#FFE0B2"
            onPress={() => console.log('Compass pressed')}
          />
        </View>

        {/* Recent Activities */}
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        {[0, 1, 2].map((i) => (
          <ActivityCard key={i} index={i} />
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Bottom Navigation - Fixed the props */}
      <BottomNavBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onNavigate={onNavigate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F5F5F5' },
  statusBarContainer: { backgroundColor: '#000', paddingTop: 40 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  greetingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  greeting: { fontSize: 18, color: '#666', marginBottom: 4 },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  lobbyCard: {
    backgroundColor: '#7CB342',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lobbyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  lobbyIdLabel: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },
  batteryNote: { color: '#2E7D32', fontSize: 10, fontStyle: 'italic' },
  lobbyId: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 16, letterSpacing: 2 },
  lobbyStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center' },
  statLabel: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  signalBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  signalBar: { width: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, height: 8 },
  signalActive: { backgroundColor: '#fff', height: 16 },
  signalMedium: { backgroundColor: 'rgba(255,255,255,0.7)', height: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  servicesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  serviceContainer: { alignItems: 'center', flex: 1 },
  serviceButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  serviceLabel: { fontSize: 12, color: '#333', textAlign: 'center', fontWeight: '500' },
  activityCard: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    height: 80,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityText: { fontSize: 16, fontWeight: '500', color: '#555' },
});

export default Dashboard;