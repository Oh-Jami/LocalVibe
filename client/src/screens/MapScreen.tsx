import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import MapView, {Callout, Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import {GeoPosition} from 'react-native-geolocation-service';
import axios from 'axios';
import {URI} from '../../redux/URI';
import {useDispatch, useSelector} from 'react-redux';
import {getAllUsers, loadUser} from '../../redux/actions/userAction';
import {Modal as RNModal} from 'react-native';
import {getAllPins, createPinAction} from '../../redux/actions/pinAction';
import ImagePicker, {ImageOrVideo} from 'react-native-image-crop-picker';
import StarRating from '../components/StarRating';

const {width, height} = Dimensions.get('window');
const CARD_HEIGHT = 240;
const CARD_WIDTH = width * 0.8;
const SPACING_FOR_CARD_INSET = width * 0.1 - 10;

type Props = {
  navigation: any;
};

const MapScreen = ({navigation}: Props) => {
  let mapAnimation = new Animated.Value(0);
  const [data, setData] = useState([
    {
      name: '',
      avatar: {url: ''},
      latitude: null,
      longitude: null,
    },
  ]);
  const [userLocation, setUserLocation] = useState<GeoPosition | null>(null);
  const [watchID, setWatchID] = useState<number | null>(null);
  const {users, user, token} = useSelector((state: any) => state.user);
  const dispatch = useDispatch();

  const [userData, setUserData] = useState({
    latitude: user?.latitude,
    longitude: user?.longitude,
  });
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [isAddingForm, setIsAddingForm] = useState(false);
  const [markerCoords, setMarkerCoords] = useState({
    latitude: user?.latitude,
    longitude: user?.longitude,
  });

  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    email: '',
    website: '',
  });
  const [image, setImage] = useState('');

  const [newProximityThreshold, setNewProximityThreshold] = useState(5);

  const handleAddPin = () => {
    setIsAddingPin(true);
  };

  const handleVisitButtonPress = (pins: any) => {
    navigation.navigate('BusinessPinScreen', {pins});
  };

  const _map = React.useRef(null);
  const _scrollView = React.useRef(null);

  const [openModal, setOpenModal] = useState(false);

  const handleConfirm = () => {
    console.log('Pinned location:', markerCoords);
    setIsAddingPin(false);
    setIsAddingForm(true);
  };

  const isCurrentUserPin = (pinCreatedBy: string, currentUserId: string) => {
    // console.log(pinCreatedBy);
    // console.log(currentUserId);
    return pinCreatedBy === currentUserId;
  };

  const deletePinHandler = async (e: any) => {
    await axios
      .delete(`${URI}/delete-pin/${e}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(res => {
        getAllPins()(dispatch);
      });
  };

  const initialMapState = {
    categories: [
      {
        name: 'Milktea Shop',
        icon: (
          <View style={styles.chipsIcon}>
            <Image source={require('../assets/maps/milktea.png')} />
          </View>
        ),
      },
      {
        name: 'Convenience Store',
        icon: (
          <View style={styles.chipsIcon}>
            <Image source={require('../assets/maps/store.png')} />
          </View>
        ),
      },
      {
        name: 'Streetfoods',
        icon: (
          <View style={styles.chipsIcon}>
            <Image source={require('../assets/maps/streetfood.png')} />
          </View>
        ),
      },
      {
        name: 'Bar',
        icon: (
          <View style={styles.chipsIcon}>
            <Image source={require('../assets/maps/bar.png')} />
          </View>
        ),
      },
      {
        name: 'Hotels',
        icon: (
          <View style={styles.chipsIcon}>
            <Image source={require('../assets/maps/hotel.png')} />
          </View>
        ),
      },
    ],
  };

  let mapIndex = 0;
  const [state, setState] = React.useState(initialMapState);

  const handleSubmit = () => {
    if (
      businessName !== '' ||
      description !== '' ||
      category !== '' ||
      contactInfo.phone !== '' ||
      contactInfo.email !== '' ||
      contactInfo.website !== ''
    ) {
      console.log(businessName);
      createPinAction(
        user,
        businessName,
        description,
        category,
        markerCoords.latitude,
        markerCoords.longitude,
        contactInfo,
        image,
      )(dispatch);
    }
    setIsAddingForm(false);
  };

  const uploadImage = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      compressImageQuality: 0.8,
      includeBase64: true,
    })
      .then((image: ImageOrVideo | null) => {
        if (image) {
          setImage('data:image/jpeg;base64,' + image.data);
        } else {
          // Handle the case where image is null or undefined
          Alert.alert('No image selected');
        }
      })
      .catch(error => {
        // Handle any errors that occur during image picking
        console.error('Image picking error:', error);
      });
  };

  const {pins} = useSelector((state: any) => state.pin);
  const nearbypin = pins.filter(
    (pins: {latitude: number; longitude: number}) => {
      const distance = haversine(
        user.latitude,
        user.longitude,
        pins.latitude,
        pins.longitude,
      );
      return distance <= newProximityThreshold;
    },
  );

  function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  const customMapStyle = [
    {
      featureType: 'all',
      elementType: 'geometry.fill',
      stylers: [
        {
          weight: '2.00',
        },
      ],
    },
    {
      featureType: 'all',
      elementType: 'geometry.stroke',
      stylers: [
        {
          color: '#9c9c9c',
        },
      ],
    },
    {
      featureType: 'all',
      elementType: 'labels.text',
      stylers: [
        {
          visibility: 'on',
        },
      ],
    },
    {
      featureType: 'landscape',
      elementType: 'all',
      stylers: [
        {
          color: '#f2f2f2',
        },
      ],
    },
    {
      featureType: 'landscape',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#FEFAF6',
        },
      ],
    },
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#FEFAF6',
        },
      ],
    },
    {
      featureType: 'poi',
      elementType: 'all',
      stylers: [
        {
          visibility: 'off',
        },
      ],
    },
    {
      featureType: 'road',
      elementType: 'all',
      stylers: [
        {
          saturation: -100,
        },
        {
          lightness: 45,
        },
      ],
    },
    {
      featureType: 'road',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#E0FBE2',
        },
      ],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#7b7b7b',
        },
      ],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.stroke',
      stylers: [
        {
          color: '#ffffff',
        },
      ],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [
        {
          visibility: 'on',
        },
        {
          color: '#00FF00',
        },
      ],
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry.fill',
      stylers: [
        {
          visibility: 'on',
        },
        {
          color: '#5fff54',
        },
      ],
    },
    {
      featureType: 'transit',
      elementType: 'all',
      stylers: [
        {
          visibility: 'off',
        },
      ],
    },
    {
      featureType: 'water',
      elementType: 'all',
      stylers: [
        {
          color: '#46bcec',
        },
        {
          visibility: 'on',
        },
      ],
    },
    {
      featureType: 'water',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#C5EAD0',
        },
      ],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#070707',
        },
      ],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [
        {
          color: '#ffffff',
        },
      ],
    },
  ];

  const [currentPinIndex, setCurrentPinIndex] = useState(0);

  const calculateCurrentPinIndex = (offsetX: number) => {
    const index = Math.floor(offsetX / (CARD_WIDTH + 20));
    setCurrentPinIndex(index);
  };

  useEffect(() => {
    const pin = pins[currentPinIndex];
    if (pin && _map.current) {
      const {latitude, longitude} = pin;
      (_map.current as MapView).animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        350,
      );
    }
  }, [currentPinIndex, pins]);

  const handleOpenModal = () => {
    console.log('Button clicked');
    setOpenModal(true);
  };

  useEffect(() => {
    getAllUsers()(dispatch);
    getAllPins()(dispatch);
  }, [dispatch]);

  useEffect(() => {
    if (users) {
      setData(users);
    }
  }, [users]);

  useEffect(() => {
    if (Geolocation) {
      const success = (geoPosition: {
        coords: {
          latitude: any;
          longitude: any;
          accuracy: any;
          altitude: any;
          altitudeAccuracy: any;
          heading: any;
          speed: any;
        };
      }) => {
        setUserLocation({
          latitude: geoPosition.coords.latitude,
          longitude: geoPosition.coords.longitude,
          accuracy: geoPosition.coords.accuracy,
          altitude: geoPosition.coords.altitude,
          altitudeAccuracy: geoPosition.coords.altitudeAccuracy,
          heading: geoPosition.coords.heading,
          speed: geoPosition.coords.speed,
        } as unknown as GeoPosition);

        setUserData({
          latitude: geoPosition.coords.latitude,
          longitude: geoPosition.coords.longitude,
        });
      };

      const error = (error: {code: any; message: any}) => {
        console.log(error.code, error.message);
      };

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      };

      setWatchID(Geolocation.watchPosition(success, error, options));
    } else {
      console.error('Geolocation is not available.');
    }

    return () => {
      if (watchID) {
        Geolocation.clearWatch(watchID);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{flex: 1}}
        customMapStyle={customMapStyle}
        showsUserLocation
        showsMyLocationButton
        region={{
          latitude: user?.latitude,
          longitude: user?.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        onPress={e => {
          if (isAddingPin) {
            setMarkerCoords(e.nativeEvent.coordinate);
          }
        }}>
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            description="Your are here"
            image={require('../assets/maps/pin.png')}>
            <Callout tooltip>
              <View>
                <View style={styles.bubble}>
                  <View className="relative">
                    <Image
                      source={{uri: user?.avatar.url}}
                      height={80}
                      width={80}
                    />
                    {/* {user.role === 'Admin' && (
                      <Image
                        source={{
                          uri: 'https://cdn-icons-png.flaticon.com/128/1828/1828640.png',
                        }}
                        width={18}
                        height={18}
                        className="ml-2 absolute bottom-0 left-0"
                      />
                    )} */}
                  </View>
                  <Text style={styles.name}>{user?.name}</Text>
                </View>
                <View style={styles.arrowBorder} />
                <View style={styles.arrow} />
              </View>
            </Callout>
          </Marker>
        )}

        {pins &&
          pins.map((pins: any) => (
            <Marker
              key={pins._id}
              coordinate={{
                latitude: pins.latitude,
                longitude: pins.longitude,
              }}
              title={pins.businessName}
              description={pins.description}
              image={require('../assets/maps/pin.png')}></Marker>
          ))}

        {isAddingPin && (
          <Marker
            draggable
            coordinate={markerCoords}
            onDragEnd={e => setMarkerCoords(e.nativeEvent.coordinate)}
          />
        )}
      </MapView>

      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search here"
          placeholderTextColor="#000"
          autoCapitalize="none"
          style={{flex: 1, padding: 0}}
        />
        <Image source={require('../assets/newsfeed/search.png')} />
      </View>

      <ScrollView
        horizontal
        scrollEventThrottle={1}
        showsHorizontalScrollIndicator={false}
        height={50}
        style={styles.chipsScrollView}
        contentInset={{
          // iOS only
          top: 0,
          left: 0,
          bottom: 0,
          right: 20,
        }}
        contentContainerStyle={{
          paddingRight: Platform.OS === 'android' ? 20 : 0,
        }}>
        {state.categories.map((category, index) => (
          <TouchableOpacity key={index} style={styles.chipsItem}>
            {category.icon}
            <Text>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Animated.ScrollView
        ref={_scrollView}
        horizontal
        pagingEnabled
        scrollEventThrottle={1}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 20}
        snapToAlignment="center"
        style={styles.scrollView}
        contentInset={{
          top: 0,
          left: SPACING_FOR_CARD_INSET,
          bottom: 0,
          right: SPACING_FOR_CARD_INSET,
        }}
        contentContainerStyle={{
          paddingHorizontal:
            Platform.OS === 'android' ? SPACING_FOR_CARD_INSET : 0,
        }}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          if (
            event.nativeEvent.contentOffset &&
            typeof event.nativeEvent.contentOffset.x === 'number'
          ) {
            calculateCurrentPinIndex(event.nativeEvent.contentOffset.x);
            const pin = pins[currentPinIndex];
            if (pin && _map.current) {
              const {latitude, longitude} = pin;
              (_map.current as MapView).animateToRegion(
                {
                  latitude,
                  longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                },
                350,
              );
            }
          }
        }}>
        {pins &&
          pins.map((pins: any) => (
            <View style={styles.card}>
              <Image
                source={{uri: pins.image.url}}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.textContent}>
                <Text numberOfLines={1} style={styles.cardtitle}>
                  {pins.businessName}
                </Text>
                <StarRating ratings={4} reviews={99} />
                <Text numberOfLines={1} style={styles.cardDescription}>
                  {pins.description}
                </Text>

                <View style={styles.cardButtons}>
                  <View style={styles.button}>
                    <TouchableOpacity
                      onPress={() => handleVisitButtonPress(pins)}
                      style={[
                        styles.signIn,
                        {
                          borderColor: '#0A6847',
                          borderWidth: 1,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.textSign,
                          {
                            color: '#0A6847',
                          },
                        ]}>
                        Visit
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.button}>
                    {isCurrentUserPin(pins.CreatedBy, user._Id) && (
                      <TouchableOpacity
                        onPress={() => setOpenModal(true)}
                        style={[
                          styles.signIn,
                          {
                            borderColor: '#e24848',
                            borderWidth: 1,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.textSign,
                            {
                              color: '#e24848',
                            },
                          ]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))}
      </Animated.ScrollView>

      {openModal && (
        <View className="flex-[1] justify-center items-center mt-[22]">
          <Modal
            animationType="fade"
            transparent={true}
            visible={openModal}
            onRequestClose={() => {
              setOpenModal(!openModal);
            }}>
            <TouchableWithoutFeedback onPress={() => setOpenModal(false)}>
              <View className="flex-[1] justify-end bg-[#00000059]">
                <TouchableWithoutFeedback onPress={() => setOpenModal(true)}>
                  <View className="w-full bg-[#fff] h-[120] rounded-[20px] p-[20px] items-center shadow-[#000] shadow-inner">
                    <TouchableOpacity
                      className="w-full bg-[#00000010] h-[50px] rounded-[10px] items-center flex-row pl-5"
                      onPress={() => deletePinHandler(pins._id)}>
                      <Text className="text-[18px] font-[600] text-[#e24848]">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      )}

      {!isAddingPin && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddPin}>
          <Image source={require('../assets/maps/addPin.png')} />
        </TouchableOpacity>
      )}

      {isAddingPin && (
        <View style={styles.confirmButtons}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}>
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsAddingPin(false)}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      <RNModal visible={isAddingForm} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <Text style={styles.modalText}>
            Fill up the form for your business pin:
          </Text>
          <TouchableOpacity
            className="Profileicon h-[67] justify-start items-center pl-6 gap-[20] flex-row"
            onPress={uploadImage}>
            <Image
              className="w-[70] h-[70] rounded-[90px]"
              source={{
                uri: image
                  ? image
                  : 'https://cdn-icons-png.flaticon.com/512/8801/8801434.png',
              }}
            />

            <Text
              className="ProfileIcon text-black text-13 font-bold font-['Roboto'] tracking-tight"
              onPress={uploadImage}>
              Business Image
            </Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Business Name"
            value={businessName}
            onChangeText={text => setBusinessName(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={text => setDescription(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Category"
            value={category}
            onChangeText={text => setCategory(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            value={contactInfo.phone}
            onChangeText={text => setContactInfo({...contactInfo, phone: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={contactInfo.email}
            onChangeText={text => setContactInfo({...contactInfo, email: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Website"
            value={contactInfo.website}
            onChangeText={text =>
              setContactInfo({...contactInfo, website: text})
            }
          />
          <Button title="Submit" onPress={handleSubmit} />
          <Button title="Cancel" onPress={() => setIsAddingForm(false)} />
        </View>
      </RNModal>
    </View>
  );
};

const styles = StyleSheet.create({
  searchBox: {
    position: 'absolute',
    marginTop: Platform.OS === 'ios' ? 40 : 20,
    flexDirection: 'row',
    backgroundColor: '#fff',
    width: '90%',
    alignSelf: 'center',
    borderRadius: 5,
    padding: 10,
    shadowColor: '#ccc',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  cardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chipsIcon: {
    marginRight: 5,
  },
  chipsScrollView: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 80,
    paddingHorizontal: 10,
  },
  chipsItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    height: 35,
    shadowColor: '#ccc',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  scrollView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
  },
  card: {
    // padding: 10,
    elevation: 2,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowRadius: 5,
    shadowOpacity: 0.3,
    shadowOffset: {x: 2, y: -2},
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    overflow: 'hidden',
  },
  cardImage: {
    flex: 3,
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
  textContent: {
    flex: 2,
    padding: 10,
  },
  cardtitle: {
    fontSize: 14,
    // marginTop: 5,
    fontWeight: 'bold',
  },
  cardDescription: {
    fontSize: 12,
    color: '#444',
  },
  signIn: {
    width: '100%',
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3,
  },
  textSign: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  mapset: {
    flexDirection: 'row',
    position: 'absolute',
    zIndex: 1,
    alignSelf: 'center',
    bottom: 10,
  },
  button: {
    marginBottom: 10,
    width: 100,
  },
  modalContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    bottom: 20,
    alignSelf: 'center',
    elevation: 5,
  },
  modalText: {
    marginBottom: 20,
    fontSize: 18,
  },
  map: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    color: 'black',
    marginBottom: 5,
    paddingRight: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    zIndex: 1,
  },
  confirmButtons: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default MapScreen;

function setWatchID(arg0: number) {
  throw new Error('Function not implemented.');
}
