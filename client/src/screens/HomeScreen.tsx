import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  TouchableOpacity,
  StatusBar,
  Image,
  FlatList,
  Animated,
  Easing,
  RefreshControl,
  Platform,
  Modal,
  Text,
  TextInput,
  Button,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {getAllPosts} from '../../redux/actions/postAction';
import PostCard from '../components/PostCard';
import Loader from '../common/Loader';
import {getAllUsers, loadUser} from '../../redux/actions/userAction';
import Geolocation from '@react-native-community/geolocation';
import {GeoPosition} from 'react-native-geolocation-service';
import Lottie from 'lottie-react-native';
import axios from 'axios';
import {URI} from '../../redux/URI';

const loader = require('../assets/newsfeed/animation_lkbqh8co.json');

type Props = {
  navigation: any;
};

const HomeScreen = ({navigation}: Props) => {
  const {users, user, token} = useSelector((state: any) => state.user);
  const {posts, isLoading} = useSelector((state: any) => state.post);
  const dispatch = useDispatch();
  const [offsetY, setOffsetY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [extraPaddingTop] = useState(new Animated.Value(0));
  const refreshingHeight = 50;
  const lottieViewRef = useRef<Lottie>(null);
  const [slice, setSlice] = useState(5);

  const [showModal, setShowModal] = useState(false);
  const [newProximityThreshold, setNewProximityThreshold] = useState(5);

  const [userLocation, setUserLocation] = useState<GeoPosition | null>(null);
  const [watchID, setWatchID] = useState<number | null>(null);
  const [userData, setUserData] = useState({
    latitude: user?.latitude,
    longitude: user?.longitude,
  });

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const updateProximityThreshold = () => {
    const newThreshold = newProximityThreshold;

    const minThreshold = 1;
    const maxThreshold = 10;

    if (
      !isNaN(newThreshold) &&
      newThreshold >= minThreshold &&
      newThreshold <= maxThreshold
    ) {
      setNewProximityThreshold(newThreshold);

      setShowModal(false);
    } else {
      alert(
        `Proximity threshold must be between ${minThreshold} and ${maxThreshold}`,
      );
    }
  };

  let progress = 0;
  if (offsetY < 0 && !refreshing) {
    const maxOffsetY = -refreshingHeight;
    progress = Math.min(offsetY / maxOffsetY, 1);
  }

  function onScroll(event: any) {
    const {nativeEvent} = event;
    const {contentOffset} = nativeEvent;
    const {y} = contentOffset;
    setOffsetY(y);
  }

  function onScrollEndDrag(event: any) {
    const {nativeEvent} = event;
    const {contentOffset} = nativeEvent;
    const {y} = contentOffset;
    setOffsetY(y);

    if (y <= -refreshingHeight && !refreshing) {
      setRefreshing(true);
      setTimeout(() => {
        getAllPosts()(dispatch);
        setRefreshing(false);
      }, 3000);
    }
  }

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

  useEffect(() => {
    getAllPosts()(dispatch);
    getAllUsers()(dispatch);
  }, [dispatch]);

  useEffect(() => {
    if (refreshing) {
      Animated.timing(extraPaddingTop, {
        toValue: refreshingHeight,
        duration: 0,
        useNativeDriver: false,
      }).start();
      setSlice(5);
    } else {
      Animated.timing(extraPaddingTop, {
        toValue: 0,
        duration: 400,
        easing: Easing.elastic(1.3),
        useNativeDriver: false,
      }).start();
      setSlice(5);
    }
  }, [refreshing]);

  function sliceHandler() {
    const s = slice + 2;
    setSlice(s);
  }

  const nearbyPosts = posts
    .filter((post: {user: {latitude: number; longitude: number}}) => {
      const distance = haversine(
        user.latitude,
        user.longitude,
        post.user.latitude,
        post.user.longitude,
      );
      return distance <= newProximityThreshold;
    })
    .slice(0, slice);

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

  const onRefreshHandler = async () => {
    setRefreshing(true);
    try {
      await submitLocation();
      await getAllUsers()(dispatch);
      await getAllPosts()(dispatch);
    } finally {
      setRefreshing(false);
    }
  };

  const submitLocation = async () => {
    await axios
      .put(
        `${URI}/update-coor`,
        {
          latitude: userData.latitude,
          longitude: userData.longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((res: any) => {
        loadUser()(dispatch);
      });
  };

  return (
    <SafeAreaView className="flex-1 bg-green-50 mb-[27%]">
      <StatusBar
        animated={true}
        backgroundColor={'#fff'}
        barStyle={'dark-content'}
        showHideTransition={'fade'}
      />

      <View className="flex flex-row p-2 justify-between bg-white">
        <View>
          <TouchableOpacity onPress={onRefreshHandler}>
            <Image source={require('../assets/wordlogo.png')} />
          </TouchableOpacity>
        </View>

        <View className="flex flex-row p-2 justify-between">
          <TouchableOpacity
            onPress={() => navigation.navigate('Search')}
            className="rounded-full p-2 mx-2 bg-green-50">
            <Image source={require('../assets/newsfeed/search.png')} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openModal}>
            <Image
              style={{
                height: 40,
                width: 40,
              }}
              source={require('../assets/radar.png')}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 my-1 mb-[43px]">
        <TouchableOpacity
          className="w-full bg-white items-center p-2 pb-[30px]"
          onPress={() => navigation.navigate('Post')}>
          <Image source={require('../assets/newsfeed/post.png')} />
        </TouchableOpacity>
      </View>

      <>
        {isLoading ? (
          <Loader />
        ) : (
          <SafeAreaView>
            <FlatList
              data={nearbyPosts}
              showsVerticalScrollIndicator={false}
              renderItem={({item}) => (
                <PostCard navigation={navigation} item={item} />
              )}
              onScroll={onScroll}
              onScrollEndDrag={onScrollEndDrag}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefreshHandler}
                  progressViewOffset={refreshingHeight}
                />
              }
              onEndReached={sliceHandler}
              onEndReachedThreshold={0.1}
            />
          </SafeAreaView>
        )}
      </>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={closeModal}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <View
            style={{
              backgroundColor: '#F1FFF8',
              padding: 20,
              borderRadius: 10,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}>
            <Text>Enter new proximity threshold in km:</Text>
            <TextInput
              style={{
                height: 40,
                borderColor: 'gray',
                borderWidth: 1,
                marginBottom: 10,
              }}
              keyboardType="numeric"
              onChangeText={text => setNewProximityThreshold(text)}
              value={newProximityThreshold}
            />
            <Text style={{color: 'gray', marginBottom: 10}}>
              (e.g., 1 for very close, 5 for close, 10 for moderate, etc.)
            </Text>
            <Button
              title="Close"
              color="#017E5E"
              onPress={updateProximityThreshold}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;
function setWatchID(arg0: any) {
  throw new Error('Function not implemented.');
}
