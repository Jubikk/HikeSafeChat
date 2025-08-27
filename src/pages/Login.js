import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  StatusBar,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const HikingLoginScreen = ({ onLoginComplete }) => {
  const [username, setUsername] = useState('');
  const [groupId, setGroupId] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleEnterLobby = () => {
    console.log('Entering lobby with:', { username, groupId, rememberMe });
    
    // Basic validation
    if (username.trim() && groupId.trim()) {
      // Handle login logic here
      console.log('Login successful, proceeding to main app');
      
      // Call the onLoginComplete callback to proceed to main app
      if (typeof onLoginComplete === 'function') {
        onLoginComplete();
      }
    } else {
      // You can add error handling here
      console.log('Please fill in all required fields');
      // You could show an alert or error message
    }
  };

  const handleCreateLobby = () => {
    console.log('Creating new lobby');
    // Handle create lobby logic here
    // After successful lobby creation, you might also want to call onLoginComplete()
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Image */}
      <ImageBackground
        source={require('../../assets/loginbg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Overlay for better text visibility */}
        <View style={styles.overlay}>
          <View style={styles.contentContainer}>
            {/* Top section with logo */}
            <View style={styles.topSection}>
              
              {/* Logo Image */}
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/hikers.png')}
                  style={styles.logoImage}
                  resizeMode="contain"/>
              <Text style={styles.appName}>HIKESAFE</Text>
              <Text style={styles.tagline}>"Stay connected. Stay safe."</Text>
              </View>
            </View>

            {/* Login form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#88A896"
                  value={username}
                  onChangeText={setUsername}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Group ID"
                  placeholderTextColor="#88A896"
                  value={groupId}
                  onChangeText={setGroupId}
                />
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginButton} onPress={handleEnterLobby}>
                <Text style={styles.loginButtonText}>Enter Lobby </Text>
              </TouchableOpacity>

              <View style={styles.createLobbyContainer}>
                <Text style={styles.createLobbyText}>Do you want to create a lobby? </Text>
                <TouchableOpacity onPress={handleCreateLobby}>
                  <Text style={styles.createLobbyLink}>Create Here.</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E7D32',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Dark overlay for better text visibility
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 60,
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 300,
    height: 300,
    top: 40,
    marginTop: -50,
  },
  appName: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#69B437',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 2,
    top: -48,
  },
  tagline: {
    fontSize: 16,
    color: '#ffffff',
    fontStyle: 'italic',
    textAlign: 'center',
    top: -48,

  },
  formContainer: {
    paddingHorizontal: 40,
    paddingBottom: 70,
  },
  inputContainer: {
    marginBottom: 20,
    top: -30,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
    fontSize: 16,
    width: 250, 
    alignSelf: 'center',
    color: '#48C029',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingLeft: 15,
    top: -30,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
    loginButton: {
    backgroundColor: '#69B437',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    width: 250, 
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createLobbyContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createLobbyText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  createLobbyLink: {
    color: '#81C784',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default HikingLoginScreen;