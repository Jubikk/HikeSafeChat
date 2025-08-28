import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const BottomNavBar = ({ activeTab, onTabPress }) => {
  const tabs = [
    { id: 'home', icon: 'home-outline', activeIcon: 'home', route: '/dashboard' },
    { id: 'web', icon: 'globe-outline', activeIcon: 'globe', route: '/web' },
    { id: 'upload', icon: 'cloud-upload-outline', activeIcon: 'cloud-upload', route: '/upload' },
    { id: 'location', icon: 'location-outline', activeIcon: 'location', route: '/map_screen' },
    { id: 'profile', icon: 'person-outline', activeIcon: 'person', route: '/userInfo' }
  ];

  const handleTabPress = (tab) => {
    if (tab.route) {
      router.push(tab.route); // navigate to the route
    }
    onTabPress(tab.id); // update active tab
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tabButton}
          onPress={() => handleTabPress(tab)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === tab.id ? tab.activeIcon : tab.icon}
            size={28}
            color={activeTab === tab.id ? '#4A90E2' : '#666'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});

export default BottomNavBar;
