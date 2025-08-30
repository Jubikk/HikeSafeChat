import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BLE_CONFIG, MESSAGE_TYPES } from '../../config/constants';
import MessageItem from './MessageItem';
import MeshStatusBar from './MeshStatusBar';

const ChatScreen = ({
  device,
  isConnected,
  messages,
  inputText,
  setInputText,
  meshStatus,
  onDisconnect,
  addMessage,
  addDebugInfo,
  navigation, // Add navigation prop for back button
}) => {
  const flatListRef = useRef(null);

  const sendMessage = async () => {
    if (!inputText.trim() || !device || !isConnected) {
      return;
    }

    const messageText = inputText.trim();
    setInputText('');

    try {
      addDebugInfo(`Sending: ${messageText.substring(0, 20)}...`);

      // Safely encode message
      let base64Message;
      try {
        const messageBytes = new TextEncoder().encode(messageText);
        base64Message = btoa(String.fromCharCode(...messageBytes));
      } catch (e) {
        // Fallback encoding
        base64Message = btoa(messageText);
      }

      await device.writeCharacteristicWithResponseForService(
        BLE_CONFIG.SERVICE_UUID,
        BLE_CONFIG.CHARACTERISTIC_UUID,
        base64Message
      );

      // Add sent message to local state
      addMessage({
        id: Date.now().toString(),
        text: messageText,
        timestamp: new Date().toISOString(),
        type: MESSAGE_TYPES.SENT,
      });

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      addDebugInfo(`Send error: ${error.message}`);
      console.error('Send error:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderMessage = ({ item }) => (
    <MessageItem
      message={item.text}
      isSent={item.type === MESSAGE_TYPES.SENT}
      timestamp={item.timestamp}
    />
  );

  return (
    <View style={styles.container}>
      <MeshStatusBar
        isConnected={isConnected}
        status={meshStatus}
        onDisconnect={onDisconnect}
      />
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
        keyboardVerticalOffset={90}
      >
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          editable={isConnected}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !isConnected && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!isConnected || !inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 30, // Same as back button for balance
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 70,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 30,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    marginRight: 8,
    fontSize: 16,
    color: '#333',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 40,
  },
  sendButtonDisabled: {
    backgroundColor: '#c0c0c0',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatScreen;
