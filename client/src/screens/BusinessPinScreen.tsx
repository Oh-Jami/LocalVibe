import React, {useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';

import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  route: any;
  navigation: any;
};

const MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 55;
const MAX_HEIGHT = 350;

const BusinessPinScreen = ({route, navigation}: Props) => {
  const {pins} = route.params;

  const handleBackPress = () => {
    navigation.navigate('Map');
  };
  const navTitleView = useRef(null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView>
        <View>
          <Image source={{uri: pins.image.url}} style={styles.image} />
          <View style={styles.navTitleView}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.9)']}
              style={styles.gradient}
            />
            <Text style={styles.navTitle}>{pins.businessName}</Text>
          </View>
        </View>

        <View>
          <View style={styles.section}>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={styles.title}>Overview</Text>
              <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
                <Image source={require('../assets/maps/star.png')} />
                <Text style={{marginHorizontal: 2}}>5</Text>
                <Text>(56)</Text>
              </View>
            </View>
          </View>
          <View style={[styles.section, styles.sectionLarge]}>
            <Text style={styles.sectionContent}>{pins.description}</Text>
          </View>
          <View style={styles.section}>
            <View style={styles.categories}>
              <View style={styles.categoryContainer}>
                <Image source={require('../assets/maps/star.png')} />
                <Text style={styles.category}>{pins.category}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.section, {height: 250}]}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{flex: 1}}
              region={{
                latitude: pins.latitude,
                longitude: pins.longitude,
                latitudeDelta: 0.00864195044303443,
                longitudeDelta: 0.000142817690068,
              }}>
              <Marker
                coordinate={{
                  latitude: pins.latitude,
                  longitude: pins.longitude,
                }}
                image={require('../assets/maps/pin.png')}
              />
            </MapView>
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  image: {
    height: MAX_HEIGHT,
    width: Dimensions.get('window').width,
    alignSelf: 'stretch',
    resizeMode: 'cover',
  },
  title: {
    fontSize: 20,
  },
  name: {
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionContent: {
    fontSize: 16,
    textAlign: 'justify',
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  categoryContainer: {
    flexDirection: 'row',
    backgroundColor: '#FF6347',
    borderRadius: 20,
    margin: 10,
    padding: 10,
    paddingHorizontal: 15,
  },
  category: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 10,
  },
  titleContainer: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTitle: {
    color: 'white',
    backgroundColor: 'transparent',
    fontSize: 24,
  },
  navTitleView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MIN_HEIGHT,
    justifyContent: 'center', // Center children vertically
    paddingTop: Platform.OS === 'ios' ? 40 : 5,
    backgroundColor: 'transparent', // Remove background color
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  navTitle: {
    color: 'white', // Text color
    fontSize: 28,
    backgroundColor: 'transparent',
    paddingLeft: 20,
    margin: 5,
  },
  sectionLarge: {
    minHeight: 150,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
  },
});

export default BusinessPinScreen;
