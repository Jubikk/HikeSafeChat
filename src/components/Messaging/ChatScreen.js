import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
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
        BLE_CONFIG.SEND_CHAR_UUID,
        base64Message
      );

      addMessage({
        type: MESSAGE_TYPES.SENT,
        text: messageText,
        sender: 'me',
      });

      addDebugInfo('Message sent successfully');

      // Scroll to bottom after sending
      setTimeout(() => {
        if (flatListRef.current) {
          try {
            flatListRef.current.scrollToEnd({ animated: true });
          } catch (e) {
            console.warn('Error scrolling to end:', e);
          }
        }
      }, 100);

    } catch (error) {
      addDebugInfo(`Send failed: ${error.message}`);
      Alert.alert('Send Error', `Failed to send message: ${error.message}`);
      
      addMessage({
        type: MESSAGE_TYPES.ERROR,
        text: `Failed to send: ${messageText}`,
        sender: 'system',
      });
    }
  };



  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>HikeSafe Mesh</Text>
          <Text style={styles.headerSubtitle}>
            {meshStatus ? `${meshStatus.nodeCount || 0} nodes` : 'Connected'}
          </Text>
        </View>
        <TouchableOpacity onPress={onDisconnect} style={styles.disconnectButton}>
          <Text style={styles.disconnectButtonText}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      {meshStatus && <MeshStatusBar meshStatus={meshStatus} />}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => <MessageItem message={item} />}
        keyExtractor={(item) => item?.id || Math.random().toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => {
          if (flatListRef.current) {
            try {
              flatListRef.current.scrollToEnd({ animated: true });
            } catch (e) {
              console.warn('Error scrolling to end:', e);
            }
          }
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type emergency message..."
          placeholderTextColor="#95a5a6"
          multiline
          maxLength={BLE_CONFIG.MAX_MESSAGE_LENGTH}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2c3e50',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ecf0f1',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#bdc3c7',
    fontSize: 14,
  },
  disconnectButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#2c3e50',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#34495e',
    color: '#ecf0f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#7f8c8d',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatScreen;