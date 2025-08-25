import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

/**
 * OnboardingScreen component - First screen asking for name
 */
const OnboardingScreen = ({ onNext }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleNext = () => {
    if (firstName.trim() && lastName.trim()) {
      if (typeof onNext === 'function') onNext();
    }
  };

  const isNextDisabled = !firstName.trim() || !lastName.trim();

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../../assets/OnBoarding-background.png')}
        style={styles.bgImage}
        resizeMode="cover"
        pointerEvents="none"
      />
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>What do we{'\n'}call you?</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#C7C7C7"
              value={firstName}
              onChangeText={setFirstName}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#C7C7C7"
              value={lastName}
              onChangeText={setLastName}
              returnKeyType="done"
            />
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
          </View>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, isNextDisabled && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={isNextDisabled}
        >
          <Text style={[styles.nextButtonText, isNextDisabled && styles.nextButtonTextDisabled]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

/**
 * SafetyFirstScreen component - Second screen for safety information
 */
const SafetyFirstScreen = ({ onNext }) => {
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [medicalCondition, setMedicalCondition] = useState('');

  const bloodTypes = [
    { label: 'Type O (Dropdown)', value: '' },
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
  ];

  const handleNext = () => {
    if (contactName.trim() && contactPhone.trim() && bloodType && medicalCondition.trim()) {
      if (typeof onNext === 'function') onNext();
    }
  };

  const isNextDisabled = !contactName.trim() || !contactPhone.trim() || !bloodType || !medicalCondition.trim();

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../../assets/OnBoarding-background.png')}
        style={styles.bgImage}
        resizeMode="cover"
        pointerEvents="none"
      />
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Safety first!</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#C7C7C7"
              value={contactName}
              onChangeText={setContactName}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone"
              placeholderTextColor="#C7C7C7"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Blood Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={bloodType}
                onValueChange={setBloodType}
                style={styles.picker}
                mode="dropdown"
              >
                {bloodTypes.map((type, index) => (
                  <Picker.Item 
                    key={index} 
                    label={type.label} 
                    value={type.value}
                    color={type.value === '' ? '#C7C7C7' : '#333'}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Medical Condition</Text>
            <TextInput
              style={styles.input}
              placeholder="Medical Condition"
              placeholderTextColor="#C7C7C7"
              value={medicalCondition}
              onChangeText={setMedicalCondition}
              returnKeyType="done"
              multiline={true}
            />
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={styles.progressDot} />
          </View>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, isNextDisabled && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={isNextDisabled}
        >
          <Text style={[styles.nextButtonText, isNextDisabled && styles.nextButtonTextDisabled]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

/**
 * Main OnboardingFlow component that handles navigation between screens
 */
const OnboardingFlow = ({ onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleNextScreen = () => {
    setCurrentScreen(currentScreen + 1);
  };

  const handleCompleteOnboarding = () => {
    // Handle onboarding completion here
    console.log('Onboarding completed!');
    if (typeof onComplete === 'function') {
      onComplete();
    }
  };

  switch (currentScreen) {
    case 0:
      return <OnboardingScreen onNext={handleNextScreen} />;
    case 1:
      return <SafetyFirstScreen onNext={handleCompleteOnboarding} />;
    default:
      return <OnboardingScreen onNext={handleNextScreen} />;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  bgImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '63%',
    zIndex: 0,
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 32,
    paddingTop: 40,
    marginTop: 0,
    zIndex: 1,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#48C029',
    marginBottom: 50,
    marginTop: 70,
    lineHeight: 48,
    textAlign: 'center',
    fontFamily: 'Montserrat-Bold',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#255D00',
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#333',
    minHeight: 44,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    height: 44,
  },
  picker: {
    height: 44,
    color: '#333',
    marginTop: Platform.OS === 'ios' ? 0 : -8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  activeDot: {
    backgroundColor: '#00C851',
  },
  footer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 32,
    paddingBottom: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    zIndex: 1,
  },
  nextButton: {
    backgroundColor: '#69B437',
    borderRadius: 4,
    height: 43,
    width: 239,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  nextButtonTextDisabled: {
    color: '#999',
  },
});

export default OnboardingFlow;