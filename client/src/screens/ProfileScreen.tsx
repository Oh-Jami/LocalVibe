import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Button,
  StatusBar,
  StyleSheet,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Dimensions} from 'react-native';
import {loadUser, logoutUser} from '../../redux/actions/userAction';
import PostCard from '../components/PostCard';

import {Avatar, Title, Caption, TouchableRipple} from 'react-native-paper';

type Props = {
  navigation: any;
};

const {width} = Dimensions.get('window');

const ProfileScreen = ({navigation}: Props) => {
  const [active, setActive] = useState(0);
  const {user} = useSelector((state: any) => state.user);
  const {posts} = useSelector((state: any) => state.post);
  const [data, setData] = useState([]);
  const [repliesData, setRepliesData] = useState([]);
  const dispatch = useDispatch();
  const logoutHandler = async () => {
    logoutUser()(dispatch);
  };

  useEffect(() => {
    if (posts && user) {
      const myPosts = posts.filter((post: any) => post.user._id === user._id);
      setData(myPosts);
    }
  }, [posts, user]);

  useEffect(() => {
    if (posts && user) {
      const myReplies = posts.filter((post: any) =>
        post.replies.some((reply: any) => reply.user._id === user._id),
      );
      setRepliesData(myReplies.filter((post: any) => post.replies.length > 0));
    }
  }, [posts, user]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <StatusBar backgroundColor="#F1FFF8" barStyle="dark-content" />
      <SafeAreaView className="relative bg-[#F1FFF8] drop-shadow-2xl">
        <View className="px-3 pt-3">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/2223/2223615.png',
              }}
              height={25}
              width={25}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.userInfoSection}>
          <View style={{flexDirection: 'row', marginTop: 15}}>
            <Image
              source={{uri: user?.avatar.url}}
              height={80}
              width={80}
              borderRadius={100}
            />
            <View style={{marginLeft: 20}}>
              <Title
                style={[
                  styles.title,
                  {
                    marginTop: 15,
                    marginBottom: 5,
                  },
                ]}>
                {user?.name}
              </Title>
              <Caption style={styles.caption}>{user?.userName}</Caption>
            </View>
          </View>
        </View>

        <Text className="p-3 text-[#000000d4] font-sans leading-6 text-[18px]">
          {user?.bio}
        </Text>

        <View style={styles.infoBoxWrapper}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('FollowerCard', {
                followers: user?.followers,
                following: user?.following,
              })
            }
            style={[
              styles.infoBox,
              {
                borderRightColor: '#dddddd',
                borderRightWidth: 1,
              },
            ]}>
            <Title>{user?.followers.length}</Title>
            <Caption>Followers</Caption>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('FollowerCard', {
                followers: user?.followers,
                following: user?.following,
              })
            }
            style={styles.infoBox}>
            <Title>{user?.following.length}</Title>
            <Caption>Following</Caption>
          </TouchableOpacity>
        </View>

        <View className="bg-[#F1FFF8]">
          <View className="px-8 py-3 flex-col w-full items-center">
            <TouchableOpacity
              onPress={() => navigation.navigate('EditProfile')}>
              <Text
                className="w-[100] pt-1 text-center h-[30px] text-[#000]"
                style={{
                  borderColor: '#666',
                  borderWidth: 1,
                  backgroundColor: '#8DECB4',
                }}>
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('PremiumScreen')}>
              <Text
                className="w-[100] pt-1 text-center h-[30px] text-[#000]"
                style={{
                  borderColor: '#666',
                  borderWidth: 1,
                  backgroundColor: '#8DECB4',
                }}>
                Premium
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="mt-5" onPress={logoutHandler}>
              <Text
                className="w-[100] pt-1 text-center h-[30px] text-[#fff]"
                style={{
                  borderColor: '#666',
                  borderWidth: 1,
                  backgroundColor: '#FA7070',
                }}>
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
          <View
            className="border-b border-b-[#00000032] px-4 py-3"
            style={{width: '100%'}}>
            <View className="w-[70%] m-auto flex-row justify-between">
              <TouchableOpacity onPress={() => setActive(0)}>
                <Text
                  className="text-[18px] pl-3 text-[#000]"
                  style={{opacity: active === 0 ? 1 : 0.6}}>
                  Posts
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActive(1)}>
                <Text
                  className="text-[18px] pl-3 text-[#000]"
                  style={{opacity: active === 1 ? 1 : 0.6}}>
                  Vibe
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {active === 0 ? (
            <View className="w-[50%] absolute h-[1px] bg-black left-[-10px] bottom-0" />
          ) : (
            <View className="w-[50%] absolute h-[1px] bg-black right-[-10px] bottom-0" />
          )}
        </View>
        {active === 0 && (
          <>
            {data &&
              data.map((item: any) => (
                <PostCard navigation={navigation} key={item._id} item={item} />
              ))}
          </>
        )}

        {active === 1 && (
          <>
            {repliesData &&
              repliesData.map((item: any) => (
                <PostCard
                  navigation={navigation}
                  key={item._id}
                  item={item}
                  replies={true}
                />
              ))}
          </>
        )}

        {active === 0 && (
          <>
            {data.length === 0 && (
              <Text className="text-black text-[14px] mt-8 text-center">
                You have no posts yet!
              </Text>
            )}
          </>
        )}

        {active === 1 && (
          <>
            {repliesData.length === 0 && (
              <Text className="text-black text-[14px] mt-8 text-center">
                No Interactions yet!
              </Text>
            )}
          </>
        )}
      </SafeAreaView>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userInfoSection: {
    paddingHorizontal: 30,
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoBoxWrapper: {
    borderBottomColor: '#dddddd',
    borderBottomWidth: 1,
    borderTopColor: '#dddddd',
    borderTopWidth: 1,
    flexDirection: 'row',
    height: 70,
  },
  infoBox: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuWrapper: {
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  menuItemText: {
    color: '#777777',
    marginLeft: 20,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 26,
  },
});
