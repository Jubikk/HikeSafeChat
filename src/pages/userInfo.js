// src/pages/userInfo.js
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { getAllUsers } from '../database/database';

export default function UserInfo({ onComplete }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getAllUsers();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  const handleContinue = () => {
    if (typeof onComplete === 'function') {
      onComplete();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📋 Debug: Stored Users</Text>
      {users.length === 0 ? (
        <Text style={styles.noData}>No users found</Text>
      ) : (
        users.map((u, i) => (
          <View key={i} style={styles.card}>
            <Text>ID: {u.id}</Text>
            <Text>Name: {u.firstName} {u.lastName}</Text>
            <Text>Contact: {u.contactName} ({u.contactPhone})</Text>
            <Text>Blood Type: {u.bloodType}</Text>
            <Text>Medical Condition: {u.medicalCondition}</Text>
            <Text>Experience Level: {u.experienceLevel}</Text>
          </View>
        ))
      )}
      
      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Continue to Device Connection</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 20 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  noData: { 
    fontSize: 16, 
    color: 'gray' 
  },
  card: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  continueButton: {
    backgroundColor: '#69B437',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});