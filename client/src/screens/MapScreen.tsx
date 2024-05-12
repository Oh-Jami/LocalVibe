import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  Image,
  FlatList,
} from 'react-native';
import MapView, {Callout, Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import {GeoPosition} from 'react-native-geolocation-service';
import axios from 'axios';
import {URI} from '../../redux/URI';
import {useDispatch, useSelector} from 'react-redux';
import {getAllUsers, loadUser} from '../../redux/actions/userAction';
import Modal from 'react-native-modal';

type Props = {
  navigation: any;
};

const MapScreen = ({navigation}: Props) => {
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

  const [isModalVisible, setModalVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const [buttonType, setButtonType] = useState('Public');

  const filterData = () => {
    const distanceThreshold = 5; // Adjust the distance threshold as needed

    if (buttonType === 'Friends') {
      // Filter data to only show friends
      const friendData = users.filter((item: any) => {
        // Assuming you have the user's ID in the "following" array
        const isFriend = user?.following.some(
          (friend: any) => friend.userId === item._id,
        );
        return isFriend;
      });

      // Use haversine to filter only within the distance threshold
      const filteredData = friendData.filter((item: any) => {
        if (item.latitude && item.longitude) {
          const distance = haversine(
            user?.latitude,
            user?.longitude,
            item.latitude,
            item.longitude,
          );
          return distance <= distanceThreshold;
        }
        return false;
      });

      setData(filteredData);
    } else if (buttonType === 'Public') {
      // Show all data within the distance threshold for public
      const filteredData = users.filter(
        (item: {latitude: number; longitude: number}) => {
          if (item.latitude && item.longitude) {
            const distance = haversine(
              user?.latitude,
              user?.longitude,
              item.latitude,
              item.longitude,
            );
            return distance <= distanceThreshold;
          }
          return false;
        },
      );

      setData(filteredData);
    } else {
      // Show all data for other button types
      const filteredData = users.filter((item: any) => {
        if (item.latitude && item.longitude) {
          const distance = haversine(
            user?.latitude,
            user?.longitude,
            item.latitude,
            item.longitude,
          );
          return distance <= distanceThreshold;
        }
        return false;
      });

      setData(filteredData);
    }
  };

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

  const handleButtonClick = (type: string) => {
    setButtonType(type);
    toggleModal();
  };

  useEffect(() => {
    filterData();
  }, [buttonType, users, user]);

  useEffect(() => {
    getAllUsers()(dispatch);
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

  const [markerCoords, setMarkerCoords] = useState({
    latitude: user?.latitude,
    longitude: user?.longitude,
  });
  const [isDragging, setIsDragging] = useState(false);

  const handleConfirm = () => {
    // Do something with the pinned location, like saving it to a database
    console.log('Pinned location:', markerCoords);
  };

  const [isAddingPin, setIsAddingPin] = useState(false); // state to track whether the user is adding a pin

  // Function to handle the "Add Pin" button click
  const handleAddPin = () => {
    setIsAddingPin(true); // Set state to indicate that the user is adding a pin
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapset} onTouchEnd={toggleModal}>
        <Image source={require('../assets/maps/users-alt.png')} />
      </View>

      <Text style={styles.modeLabel}>{buttonType ? `${buttonType}` : ''}</Text>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{flex: 1}}
        showsUserLocation
        showsMyLocationButton
        region={{
          latitude: userLocation ? userLocation.latitude : 14.8327,
          longitude: userLocation ? userLocation.longitude : 120.2822,
          latitudeDelta: 0.09,
          longitudeDelta: 0.09,
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

        {isAddingPin && (
          <Marker
            draggable
            coordinate={markerCoords}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={e => {
              setIsDragging(false);
              setMarkerCoords(e.nativeEvent.coordinate);
            }}
          />
        )}
      </MapView>
      {isDragging && <Text>Drag the pin to adjust location</Text>}
      <Button
        title="Confirm"
        onPress={handleConfirm}
        disabled={!markerCoords}
      />
      <Button title="Add Pin" onPress={handleAddPin} />
      {/* Modal */}
      <Modal isVisible={isModalVisible} style={styles.modalContainer}>
        <View style={styles.buttonContainers}>
          <Button
            style={styles.button}
            title="Public"
            color="#017E5E"
            onPress={() => handleButtonClick('Public')}
          />
          <Button
            style={styles.button}
            title="Friends"
            color="#017E5E"
            onPress={() => handleButtonClick('Friends')}
          />
          <Button
            style={styles.button}
            title="Groups"
            color="#017E5E"
            onPress={() => handleButtonClick('Groups')}
          />
          <Button
            style={styles.button}
            title="Businesses"
            color="#017E5E"
            onPress={() => handleButtonClick('Businesses')}
          />
        </View>
        <Button color="#017E5E" title="Close" onPress={toggleModal} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeLabel: {
    color: '#017E5E',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -75,
  },
  mapset: {
    flexDirection: 'row',
    padding: 10,
    marginHorizontal: 20,
    marginRight: 80,
    marginTop: 12,
    position: 'absolute',
    zIndex: 1,
    backgroundColor: 'white',
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContainers: {
    justifyContent: 'space-around',
    margin: 10,
  },
  button: {
    marginBottom: 10,
    width: 100,
  },
  modalContainer: {
    backgroundColor: '#F1FFF8',
    padding: 16,
    borderRadius: 8,
    width: 300,
    height: 200,
    alignSelf: 'center',
    marginTop: '140%',
  },
  map: {
    flex: 1,
  },
  bubble: {
    flexDirection: 'row',
    alighSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 6,
    borderColor: '#ccc',
    borderWidth: 0.5,
    padding: 15,
    width: 150,
  },
  name: {
    fontSize: 16,
    color: 'black',
    marginBottom: 5,
    paddingRight: 20,
  },
  arrow: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 16,
    alignSelf: 'center',
    marginTop: -32,
  },
  arrowBorder: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: '#007a87',
    borderwidth: 16,
    alignSelf: 'center',
    marginTop: -0.5,
    marginBottom: -15,
  },
  image: {
    width: 50,
    height: 50,
    zIndex: 1,
  },
});

export default MapScreen;

function setWatchID(arg0: number) {
  throw new Error('Function not implemented.');
}
