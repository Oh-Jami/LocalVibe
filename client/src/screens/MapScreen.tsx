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

type Props = {
  navigation: any;
};

const MapScreen = ({navigation}: Props) => {
  // const {pins, isLoading} = useSelector((state: any) => state.pins);
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

  const [openModal, setOpenModal] = useState(false);

  const handleConfirm = () => {
    console.log('Pinned location:', markerCoords);
    setIsAddingPin(false);
    setIsAddingForm(true);
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
          color: '#ffffff',
        },
      ],
    },
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#ffffff',
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
              image={require('../assets/maps/pin.png')}>
              <Callout tooltip>
                <View>
                  <View style={styles.calloutContainer}>
                    <View style={styles.titleHeader}>
                      <View style={styles.textContainer}>
                        <Text style={styles.title}>{pins.businessName}</Text>
                        <Text>{pins.description}</Text>
                      </View>
                      <Text>
                        <Image
                          source={{
                            uri: 'https://cdn-icons-png.flaticon.com/512/2589/2589197.png',
                          }}
                          width={30}
                          height={30}
                          resizeMode="cover"
                        />
                      </Text>
                    </View>

                    <View style={styles.imagePin}>
                      <Text>
                        {pins.image && (
                          <Image
                            style={styles.image}
                            source={{uri: pins.image.url}}
                          />
                        )}
                      </Text>

                      <Button
                        onPress={() => setOpenModal(true)}
                        title="menu"
                        color="#000"
                      />
                    </View>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}

        {isAddingPin && (
          <Marker
            draggable
            coordinate={markerCoords}
            onDragEnd={e => setMarkerCoords(e.nativeEvent.coordinate)}
          />
        )}
      </MapView>

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
  calloutContainer: {
    width: 350,
    height: 250,
    flexDirection: 'column',
    backgroundColor: '#E0FBE2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    paddingTop: 5,
    paddingLeft: 20,
    paddingRight: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  titleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imagePin: {
    width: 70,
    height: 100,
  },
  image: {
    width: 70,
    height: 70,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    height: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  description: {},
  container: {
    flex: 1,
  },
  mapset: {
    flexDirection: 'row',
    position: 'absolute',
    zIndex: 1,
    alignSelf: 'center',
    bottom: 20,
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
