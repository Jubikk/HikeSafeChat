import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import BottomNavBar from '../components/navbar/bottomNavBar';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    // Handle navigation logic here
    console.log('Tab pressed:', tabId);
  };

  const ServiceButton = ({ iconName, label, badgeCount, backgroundColor }) => (
    <View style={styles.serviceContainer}>
      <TouchableOpacity 
        style={[styles.serviceButton, { backgroundColor }]}
        activeOpacity={0.7}
        onPress={() => console.log(`${label} pressed`)}
      >
        <Ionicons name={iconName} size={32} color="#333" />
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.serviceLabel}>{label}</Text>
    </View>
  );

  const ActivityCard = ({ index }) => (
    <TouchableOpacity 
      style={styles.activityCard}
      onPress={() => console.log(`Activity ${index + 1} pressed`)}
      activeOpacity={0.7}
    >
      <View style={styles.activityPlaceholder}>
        <Text style={styles.activityPlaceholderText}>Activity {index + 1}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting Card */}
        <View style={styles.greetingCard}>
          <Text style={styles.greeting}>Hello!</Text>
          <Text style={styles.userName}>John Doe</Text>
        </View>

        {/* Lobby ID Card */}
        <View style={styles.lobbyCard}>
          <View style={styles.lobbyHeader}>
            <Text style={styles.lobbyIdLabel}>LOBBY ID</Text>
            <Text style={styles.batteryNote}>NOTE: *battery health of lora*</Text>
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
          />
          <ServiceButton
            iconName="chatbubble-outline"
            label="Message"
            badgeCount={2}
            backgroundColor="#C8E6C9"
          />
          <ServiceButton
            iconName="warning-outline"
            label="SOS Alert"
            badgeCount={0}
            backgroundColor="#BBDEFB"
          />
          <ServiceButton
            iconName="navigate-outline"
            label="Compass"
            badgeCount={1}
            backgroundColor="#FFE0B2"
          />
        </View>

        {/* Recent Activities Section */}
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        <ActivityCard index={0} />
        <ActivityCard index={1} />
        <ActivityCard index={2} />
        
        {/* Bottom spacing for scroll */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A4A4A',
        marginTop: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  greetingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  greeting: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  lobbyCard: {
    backgroundColor: '#7CB342',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lobbyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lobbyIdLabel: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: 'bold',
  },
  batteryNote: {
    color: '#2E7D32',
    fontSize: 10,
    fontStyle: 'italic',
  },
  lobbyId: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    letterSpacing: 2,
  },
  lobbyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  signalBar: {
    width: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    height: 8,
  },
  signalActive: {
    backgroundColor: '#FFFFFF',
    height: 16,
  },
  signalMedium: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    height: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  servicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  serviceContainer: {
    alignItems: 'center',
    flex: 1,
  },
  serviceButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  serviceLabel: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  activityCard: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    height: 80,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.84,
    elevation: 3,
  },
  activityPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityPlaceholderText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default Dashboard;