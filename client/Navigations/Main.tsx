import React, {useEffect, useState} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Tabs from './Tabs';
import OnBoarding from '../src/screens/OnBoarding';
import {getItem, setItem} from '../utils/asyncStorage';
import PostScreen from '../src/screens/PostScreen';
import ProfileScreen from '../src/screens/ProfileScreen';
import SearchScreen from '../src/screens/SearchScreen';
import UserProfileScreen from '../src/screens/UserProfileScreen';
import CreateRepliesScreen from '../src/screens/CreateRepliesScreen';
import PostDetailsScreen from '../src/screens/PostDetailsScreen';
import PostLikeCard from '../src/components/PostLikeCard';
import FollowerCard from '../src/components/FollowerCard';
import EditProfile from '../src/components/EditProfile';
import BusinessPinScreen from '../src/screens/BusinessPinScreen';

type Props = {};

const Main = (props: Props) => {
  const Stack = createNativeStackNavigator();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null); // Set initial state as null

  useEffect(() => {
    checkIfAlreadyOnboarded();
  }, []);

  const checkIfAlreadyOnboarded = async () => {
    let onBoarded = await getItem('onBoarded');

    if (onBoarded === null) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  };

  if (showOnboarding === null) {
    return null;
  }

  if (showOnboarding) {
    return (
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="OnBoarding" component={OnBoarding} />
        <Stack.Screen name="Home" component={Tabs} />
        <Stack.Screen name="Post" component={PostScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
        <Stack.Screen name="CreateReplies" component={CreateRepliesScreen} />
        <Stack.Screen name="PostDetails" component={PostDetailsScreen} />
        <Stack.Screen name="BusinessPin" component={BusinessPinScreen} />
        <Stack.Screen name="PostLikeCard" component={PostLikeCard} />
        <Stack.Screen name="FollowerCard" component={FollowerCard} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
      </Stack.Navigator>
    );
  } else {
    return (
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Home" component={Tabs} />
        <Stack.Screen name="Post" component={PostScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
        <Stack.Screen name="CreateReplies" component={CreateRepliesScreen} />
        <Stack.Screen name="PostDetails" component={PostDetailsScreen} />
        <Stack.Screen name="BusinessPinScreen" component={BusinessPinScreen} />
        <Stack.Screen name="PostLikeCard" component={PostLikeCard} />
        <Stack.Screen name="FollowerCard" component={FollowerCard} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
      </Stack.Navigator>
    );
  }
};

export default Main;
