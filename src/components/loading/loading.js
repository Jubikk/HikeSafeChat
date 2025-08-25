import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const Loading = ({ visible = true }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/Loading_feature.gif')}
        style={styles.loadingGif}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingGif: {
    width: Dimensions.get('window').width * 0.5,
    height: Dimensions.get('window').width * 0.5,
  },
});

export default Loading;


// To import this, you can : 

//import Loading from '../components/loading/loading';

// Inside your component's render/return:
<Loading visible={true} />  // Set visible to false to hide it

//

