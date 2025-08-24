import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MESSAGE_TYPES } from '../config/constants';

const { width } = Dimensions.get('window');

const MessageItem = ({ message }) => {
  if (!message || !message.id) {
    return null;
  }

  const isSystem = message.type === MESSAGE_TYPES.SYSTEM;
  const isSent = message.type === MESSAGE_TYPES.SENT;
  const isError = message.type === MESSAGE_TYPES.ERROR;
  const isReceived = message.type === MESSAGE_TYPES.RECEIVED;

  return (
    <View style={[
      styles.messageContainer,
      isSent && styles.sentMessage,
      isSystem && styles.systemMessage,
      isError && styles.errorMessage,
    ]}>
      <View style={[
        styles.messageContent,
        isSent && styles.sentMessageContent,
        isSystem && styles.systemMessageContent,
        isError && styles.errorMessageContent,
      ]}>
        {(isReceived || isError) && message.sender && (
          <Text style={styles.senderText}>
            {message.sender}
            {message.rssi && ` (${message.rssi} dBm)`}
          </Text>
        )}
        <Text style={[
          styles.messageText,
          isSent && styles.sentMessageText,
          isSystem && styles.systemMessageText,
          isError && styles.errorMessageText,
        ]}>
          {message.text || ''}
        </Text>
        <Text style={[
          styles.timestampText,
          isSent && styles.sentTimestampText,
        ]}>
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 12,
    alignSelf: 'flex-start',
    maxWidth: width * 0.8,
  },
  sentMessage: {
    alignSelf: 'flex-end',
  },
  systemMessage: {
    alignSelf: 'center',
  },
  errorMessage: {
    alignSelf: 'flex-end',
  },
  messageContent: {
    backgroundColor: '#2c3e50',
    padding: 12,
    borderRadius: 12,
    borderBottomLeftRadius: 4,
  },
  sentMessageContent: {
    backgroundColor: '#3498db',
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 12,
  },
  systemMessageContent: {
    backgroundColor: '#7f8c8d',
    borderRadius: 12,
  },
  errorMessageContent: {
    backgroundColor: '#e74c3c',
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 12,
  },
  messageText: {
    color: '#ecf0f1',
    fontSize: 16,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#fff',
  },
  systemMessageText: {
    color: '#ecf0f1',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorMessageText: {
    color: '#fff',
  },
  senderText: {
    color: '#95a5a6',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  timestampText: {
    color: '#7f8c8d',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  sentTimestampText: {
    color: '#bdc3c7',
  },
});

export default MessageItem;