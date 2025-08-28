// import * as Location from 'expo-location';
// import { useEffect, useState } from 'react';
// import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
// import MapView, { Circle, Marker } from 'react-native-maps';

// const MapScreen = () => {
//   const [location, setLocation] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [isOffline, setIsOffline] = useState(false);
//   const [error, setError] = useState(null);
//   const [mapReady, setMapReady] = useState(false);

//   useEffect(() => {
//     const getLocation = async () => {
//       try {
//         console.log('Starting location request...');
        
//         // Check if location services are enabled
//         const servicesEnabled = await Location.hasServicesEnabledAsync();
//         if (!servicesEnabled) {
//           console.log('Location services not enabled');
//           Alert.alert(
//             'Location Services Disabled', 
//             'Please enable location services in your device settings to use this feature.',
//             [{ text: 'OK' }]
//           );
//           setError('Location services disabled');
//           setLoading(false);
//           return;
//         }

//         console.log('Location services enabled, requesting permissions...');
        
//         // Request location permissions
//         let { status } = await Location.requestForegroundPermissionsAsync();
//         console.log('Permission status:', status);
        
//         if (status !== 'granted') {
//           Alert.alert(
//             'Permission Denied', 
//             'Location permissions are required to show your position on the map.',
//             [{ text: 'OK' }]
//           );
//           setError('Permission denied');
//           setLoading(false);
//           return;
//         }

//         console.log('Permissions granted, getting current location...');

//         // Try to get current location with more lenient settings
//         try {
//             let currentLocation = await Location.getCurrentPositionAsync({
//             accuracy: Location.Accuracy.High, // force GPS
//             maximumAge: 30000,
//             timeout: 20000, // give GPS enough time to fix
//             });

//           console.log('Got current location:', currentLocation.coords);

//           setLocation({
//             latitude: currentLocation.coords.latitude,
//             longitude: currentLocation.coords.longitude,
//             latitudeDelta: 0.01,
//             longitudeDelta: 0.01,
//           });
//           setLoading(false);
//           return;
//         } catch (locationError) {
//           console.log('getCurrentPosition failed:', locationError);
          
//           // Try last known location
//           console.log('Trying last known location...');
//           try {
//             let lastKnown = await Location.getLastKnownPositionAsync({
//               maxAge: 600000,
//               requiredAccuracy: 2000,
//             });
            
//             if (lastKnown) {
//               console.log('Got last known location:', lastKnown.coords);
//               setLocation({
//                 latitude: lastKnown.coords.latitude,
//                 longitude: lastKnown.coords.longitude,
//                 latitudeDelta: 0.01,
//                 longitudeDelta: 0.01,
//               });
//               setIsOffline(true);
//               setLoading(false);
//               return;
//             }
//           } catch (lastKnownError) {
//             console.log('Last known location failed:', lastKnownError);
//           }

//           // Fallback to default location
//           console.log('Using default location (Manila)');
//           setLocation({
//             latitude: 14.5995,
//             longitude: 120.9842,
//             latitudeDelta: 0.1,
//             longitudeDelta: 0.1,
//           });
//           setIsOffline(true);
//           setError('Using default location');
//           Alert.alert(
//             'Location Not Available', 
//             'Unable to determine your exact location. Showing default location (Manila).'
//           );
//           setLoading(false);
//         }

//       } catch (error) {
//         console.log('General error:', error);
//         setError(error.message);
        
//         // Always provide a fallback location
//         setLocation({
//           latitude: 14.5995,
//           longitude: 120.9842,
//           latitudeDelta: 0.1,
//           longitudeDelta: 0.1,
//         });
//         setIsOffline(true);
//         setLoading(false);
        
//         Alert.alert(
//           'Location Error', 
//           `Error: ${error.message}\nShowing default location.`
//         );
//       }
//     };

//     getLocation();
//   }, []);

//   if (loading) {
//     return (
//       <View style={styles.loader}>
//         <ActivityIndicator size="large" color="#4A90E2" />
//         <Text style={styles.loadingText}>Getting your location...</Text>
//         <Text style={styles.debugText}>
//           This should only take a few seconds. If it's stuck, check your location settings.
//         </Text>
//       </View>
//     );
//   }

//   if (!location) {
//     return (
//       <View style={styles.loader}>
//         <Text style={styles.errorText}>Unable to load map</Text>
//         <Text style={styles.debugText}>Error: {error}</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {(isOffline || !mapReady) && (
//         <View style={styles.offlineNotice}>
//           <Text style={styles.offlineText}>
//             📍 {error || 'Location detected'} • {!mapReady ? 'Loading map...' : 'Limited offline functionality'}
//           </Text>
//         </View>
//       )}
      
//       <MapView
//         style={styles.map}
//         region={location}
//         showsUserLocation={true}
//         showsMyLocationButton={true}
//         showsCompass={true}
//         showsScale={true}
//         // Use different map types for better offline support
//         mapType={Platform.OS === 'ios' ? 'standard' : 'standard'}
//         followsUserLocation={false}
//         showsPointsOfInterest={false}
//         showsBuildings={false}
//         showsTraffic={false}
//         loadingEnabled={true}
//         loadingIndicatorColor="#4A90E2"
//         loadingBackgroundColor="#ffffff"
//         // Offline-friendly settings
//         cacheEnabled={true} // Enable map caching
//         // Map callbacks
//         onMapReady={() => {
//           console.log('Map ready');
//           setMapReady(true);
//           // Small delay to ensure map has fully loaded
//           setTimeout(() => {
//             setMapReady(true);
//           }, 1000);
//         }}
//         onMapLoaded={() => {
//           console.log('Map loaded');
//         }}
//         onRegionChange={(region) => console.log('Region changed:', region)}
//         // Don't specify a provider to use the default (Apple Maps on iOS, Google on Android)
//       >
//         {location && (
//           <>
//             <Marker
//               coordinate={{
//                 latitude: location.latitude,
//                 longitude: location.longitude,
//               }}
//               title="You are here"
//               description={`Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}`}
//               pinColor="red"
//             />
//             <Circle
//               center={{
//                 latitude: location.latitude,
//                 longitude: location.longitude,
//               }}
//               radius={100}
//               fillColor="rgba(74, 144, 226, 0.2)"
//               strokeColor="rgba(74, 144, 226, 0.8)"
//               strokeWidth={2}
//             />
//           </>
//         )}
//       </MapView>
      
//       {/* Coordinates display */}
//       <View style={styles.coordinatesBox}>
//         <Text style={styles.coordinatesText}>
//           📍 Coordinates: {location?.latitude.toFixed(6)}, {location?.longitude.toFixed(6)}
//         </Text>
//         {error && (
//           <Text style={styles.errorText}>Status: {error}</Text>
//         )}
//       </View>

//       {/* Offline instructions */}
//       {!mapReady && (
//         <View style={styles.instructionsBox}>
//           <Text style={styles.instructionsText}>
//             💡 For offline use: Navigate to areas while online to cache map tiles
//           </Text>
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   map: {
//     ...StyleSheet.absoluteFillObject,
//     flex: 1,
//   },
//   loader: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f5f5f5',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//   },
//   debugText: {
//     marginTop: 10,
//     fontSize: 12,
//     color: '#999',
//     textAlign: 'center',
//   },
//   errorText: {
//     fontSize: 14,
//     color: '#d32f2f',
//     textAlign: 'center',
//     marginTop: 5,
//   },
//   offlineNotice: {
//     position: 'absolute',
//     top: 50,
//     left: 10,
//     right: 10,
//     backgroundColor: 'rgba(255, 193, 7, 0.9)',
//     padding: 10,
//     borderRadius: 8,
//     zIndex: 1,
//   },
//   offlineText: {
//     textAlign: 'center',
//     fontSize: 14,
//     color: '#333',
//     fontWeight: '500',
//   },
//   coordinatesBox: {
//     position: 'absolute',
//     bottom: 80,
//     left: 10,
//     right: 10,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     padding: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     zIndex: 1,
//   },
//   coordinatesText: {
//     textAlign: 'center',
//     fontSize: 12,
//     color: '#333',
//     fontWeight: '500',
//   },
//   instructionsBox: {
//     position: 'absolute',
//     bottom: 20,
//     left: 10,
//     right: 10,
//     backgroundColor: 'rgba(33, 150, 243, 0.9)',
//     padding: 10,
//     borderRadius: 8,
//     zIndex: 1,
//   },
//   instructionsText: {
//     textAlign: 'center',
//     fontSize: 12,
//     color: 'white',
//     fontWeight: '500',
//   },
// });

// export default MapScreen;