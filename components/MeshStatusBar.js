import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

const MeshStatusBar = ({ meshStatus }) => {
  if (!meshStatus) {
    return null;
  }

  return (
    <View style={styles.meshStatus}>
      <Text style={styles.meshStatusText}>
        Node: {meshStatus.nodeId?.substring(0, 8) || 'Unknown'}... | 
        Uptime: {Math.floor((meshStatus.uptime || 0) / 60)}m | 
        Nodes: {meshStatus.nodeCount || 0} |
        Msgs: {meshStatus.totalReceived || 0}/{meshStatus.totalSent || 0}
      </Text> 
    </View>
  );
};

const styles = StyleSheet.create({
  meshStatus: {
    backgroundColor: '#27ae60',
    padding: 8,
  },
  meshStatusText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default MeshStatusBar;