import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { getAllUsers } from '../database/database';
import BottomNavBar from '../components/navbar/bottomNavBar';

export default function UserInfo({ onComplete, onNavigate, onNavigateToBLE }) {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    
    // Map tabId to screen name and navigate
    const screenMapping = {
      'home': 'dashboard',
      'profile': 'userInfo'
    };
    
    const targetScreen = screenMapping[tabId];
    if (onNavigate && targetScreen) {
      console.log('UserInfo: Navigating to screen:', targetScreen);
      onNavigate(targetScreen);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('UserInfo: Fetching users...');
        
        const data = await getAllUsers();
        console.log('UserInfo: Fetched users:', data);
        console.log('UserInfo: Number of users:', data?.length || 0);
        
        setUsers(data || []);
      } catch (err) {
        console.error('UserInfo: Error fetching users:', err);
        setError(err.message || 'Failed to fetch users');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const handleContinue = () => {
    console.log('Continue button pressed - navigating to BLE');
    // Navigate to BLE connection instead of calling onComplete
    if (typeof onNavigateToBLE === 'function') {
      onNavigateToBLE();
    } else if (typeof onComplete === 'function') {
      onComplete();
    }
  };

  const renderUserCard = (user, index) => {
    console.log(`UserInfo: Rendering user ${index}:`, user);
    return (
      <View key={index} style={styles.card}>
        <Text style={styles.cardText}>ID: {user.id || 'N/A'}</Text>
        <Text style={styles.cardText}>Name: {user.firstName || 'N/A'} {user.lastName || 'N/A'}</Text>
        <Text style={styles.cardText}>Nickname: {user.nickName || 'N/A'}</Text>
        <Text style={styles.cardText}>Contact: {user.contactName || 'N/A'} ({user.contactPhone || 'N/A'})</Text>
        <Text style={styles.cardText}>Blood Type: {user.bloodType || 'N/A'}</Text>
        <Text style={styles.cardText}>Medical Condition: {user.medicalCondition || 'N/A'}</Text>
        <Text style={styles.cardText}>Experience Level: {user.experienceLevel || 'N/A'}</Text>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.statusBarContainer} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Debug: Stored Users</Text>
        
        {loading ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>Loading users...</Text>
          </View>
        ) : error ? (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, styles.errorText]}>Error: {error}</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.statusContainer}>
            <Text style={styles.noData}>No users found</Text>
            <Text style={styles.debugText}>
              This might mean:
              {'\n'}• No onboarding data was saved
              {'\n'}• Database connection issue
              {'\n'}• Users table is empty
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statusContainer}>
              <Text style={styles.debugText}>Found {users.length} user(s)</Text>
            </View>
            {users.map((user, index) => renderUserCard(user, index))}
          </>
        )}
        
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to Device Connection</Text>
        </TouchableOpacity>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      <BottomNavBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onNavigate={onNavigate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { 
    flex: 1, 
    backgroundColor: '#F5F5F5' 
  },
  statusBarContainer: { 
    backgroundColor: '#000',
    paddingTop: 40 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 20 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333',
    marginBottom: 20 
  },
  statusContainer: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    color: '#1976D2',
    textAlign: 'center',
  },
  errorText: {
    color: '#D32F2F',
  },
  debugText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noData: { 
    fontSize: 16, 
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  continueButton: {
    backgroundColor: '#7CB342',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 24,
  },
});