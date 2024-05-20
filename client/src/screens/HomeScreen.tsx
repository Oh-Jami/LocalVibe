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
  Modal,
  Text,
  Button,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {getAllPosts} from '../../redux/actions/postAction';
import PostCard from '../components/PostCard';
import Loader from '../common/Loader';
import {getAllUsers, loadUser} from '../../redux/actions/userAction';
import Geolocation from '@react-native-community/geolocation';
import Lottie from 'lottie-react-native';
import axios from 'axios';
import {URI} from '../../redux/URI';
import Slider from '@react-native-community/slider';

const loader = require('../assets/newsfeed/animation_lkbqh8co.json');

type Props = {
  navigation: any;
};

const HomeScreen = ({navigation}: Props) => {
  const {user, token} = useSelector((state: any) => state.user);
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

  const [showThreshold, setShowThreshold] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [userData, setUserData] = useState({
    latitude: user?.latitude,
    longitude: user?.longitude,
  });

  const openThreshold = () => {
    setShowThreshold(true);
  };

  const closeThreshold = () => {
    setShowThreshold(false);
  };

  const updateProximityThreshold = () => {
    const minThreshold = 0.5;
    const maxThreshold = 10;

    if (
      !isNaN(newProximityThreshold) &&
      newProximityThreshold >= minThreshold &&
      newProximityThreshold <= maxThreshold
    ) {
      setNewProximityThreshold(newProximityThreshold);
      setShowThreshold(false);
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

  useEffect(() => {
    if (Geolocation) {
      const success = (geoPosition: {
        coords: {
          latitude: number;
          longitude: number;
          accuracy: number;
          altitude: number;
          altitudeAccuracy: number;
          heading: number;
          speed: number;
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
        });

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

      const watchId = Geolocation.watchPosition(success, error, options);
      return () => Geolocation.clearWatch(watchId);
    } else {
      console.error('Geolocation is not available.');
    }
  }, []);

  console.log(userData);

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

  interface Post {
    id: number;
    user: {
      latitude: number;
      longitude: number;
      accountType: string;
    };
  }

  const filterAndFormatPosts = () => {
    const filteredPosts = posts
      .filter((post: Post) => {
        const distance = haversine(
          userData.latitude,
          userData.longitude,
          post.user.latitude,
          post.user.longitude,
        );
        return distance <= newProximityThreshold;
      })
      .slice(0, slice);

    const premiumBusinessPosts = filteredPosts.filter(
      (post: Post) => post.user.accountType === 'prembusiness',
    );

    const regularBusinessPosts = filteredPosts.filter(
      (post: Post) => post.user.accountType === 'business',
    );

    const personalPosts = filteredPosts.filter(
      (post: Post) => post.user.accountType === 'personal',
    );

    let formattedPosts: Post[] = [];
    let premiumIndex = 0;
    let regularIndex = 0;
    let personalIndex = 0;
    let premiumCounter = 0;

    while (
      premiumIndex < premiumBusinessPosts.length ||
      regularIndex < regularBusinessPosts.length ||
      personalIndex < personalPosts.length
    ) {
      if (premiumCounter < 2 && premiumIndex < premiumBusinessPosts.length) {
        formattedPosts.push(premiumBusinessPosts[premiumIndex]);
        premiumIndex++;
        premiumCounter++;
      } else if (regularIndex < regularBusinessPosts.length) {
        formattedPosts.push(regularBusinessPosts[regularIndex]);
        regularIndex++;
        premiumCounter = 0;
      }

      for (let i = 0; i < 3 && personalIndex < personalPosts.length; i++) {
        formattedPosts.push(personalPosts[personalIndex]);
        personalIndex++;
      }
    }

    return formattedPosts;
  };

  const nearbyPosts = filterAndFormatPosts();

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
    console.log('Submitting coordinates');
    try {
      await axios.put(
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
      );
      loadUser()(dispatch);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('Unauthorized: Please log in again');
      } else {
        console.error('An error occurred:', error.message);
      }
    }
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
          <TouchableOpacity onPress={openThreshold}>
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
        visible={showThreshold}
        onRequestClose={closeThreshold}>
        <View style={styles.modalContainer}>
          <Text>
            Adjust proximity threshold (in km):{' '}
            {newProximityThreshold.toFixed(2)} km
          </Text>
          <Slider
            style={{width: '100%', marginTop: 10}}
            minimumValue={0.5}
            maximumValue={10}
            minimumTrackTintColor="#017E5E"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#017E5E"
            value={newProximityThreshold}
            onValueChange={setNewProximityThreshold}
          />
          <Button
            title="Confirm"
            color="#017E5E"
            onPress={updateProximityThreshold}
          />
          <Button title="Close" color="#017E5E" onPress={closeThreshold} />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#F1FFF8',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default HomeScreen;
