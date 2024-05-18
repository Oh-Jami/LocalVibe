import axios from 'axios';
import {URI} from '../URI';
import {Dispatch} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// register user
export const registerUser =
  (
    name: string,
    email: string,
    password: string,
    avatar: string,
    accountType: string,
  ) =>
  async (dispatch: Dispatch<any>) => {
    try {
      dispatch({
        type: 'userRegisterRequest',
      });

      const config = {headers: {'Content-Type': 'application/json'}};
      const {data} = await axios.post(
        `${URI}/registration`,
        {name, email, password, avatar, accountType},
        config,
      );
      dispatch({
        type: 'userRegisterSuccess',
        payload: data.user,
      });
      await AsyncStorage.setItem('token', data.token);
    } catch (error: any) {
      dispatch({
        type: 'userRegisterFailed',
        payload: error.response.data.message,
      });
    }
  };

// load user
export const loadUser = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch({
      type: 'userLoadRequest',
    });

    const token = await AsyncStorage.getItem('token');

    const {data} = await axios.get(`${URI}/me`, {
      headers: {Authorization: `Bearer ${token}`},
    });

    dispatch({
      type: 'userLoadSuccess',
      payload: {
        user: data.user,
        token,
      },
    });
  } catch (error: any) {
    dispatch({
      type: 'userLoadFailed',
      payload: error.response.data.message,
    });
  }
};

// login user
export const loginUser =
  (email: string, password: string) => async (dispatch: Dispatch<any>) => {
    try {
      dispatch({
        type: 'userLoginRequest',
      });

      const config = {headers: {'Content-Type': 'application/json'}};

      const {data} = await axios.post(
        `${URI}/login`,
        {email, password},
        config,
      );
      dispatch({
        type: 'userLoginSuccess',
        payload: data.user,
      });
      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
      }
    } catch (error: any) {
      dispatch({
        type: 'userLoginFailed',
        payload: error.response.data.message,
      });
    }
  };

// log out user
export const logoutUser = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch({
      type: 'userLogoutRequest',
    });

    await AsyncStorage.setItem('token', '');

    dispatch({
      type: 'userLogoutSuccess',
      payload: {},
    });
  } catch (error) {
    dispatch({
      type: 'userLogoutFailed',
    });
  }
};

// get all users
export const getAllUsers = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch({
      type: 'getUsersRequest',
    });

    const token = await AsyncStorage.getItem('token');

    const {data} = await axios.get(`${URI}/users`, {
      headers: {Authorization: `Bearer ${token}`},
    });

    dispatch({
      type: 'getUsersSuccess',
      payload: data.users,
    });
  } catch (error: any) {
    dispatch({
      type: 'getUsersFailed',
      payload: error.response.data.message,
    });
  }
};

interface FollowUnfollowParams {
  userId: string;
  followUserId: string;
  users: any;
}

// follow user
export const followUserAction =
  ({userId, users, followUserId}: FollowUnfollowParams) =>
  async (dispatch: Dispatch<any>) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const updatedUsers = users.map((userObj: any) =>
        userObj._id === followUserId
          ? {
              ...userObj,
              followers: [...userObj.followers, {userId}],
            }
          : userObj,
      );

      // update our users state
      dispatch({
        type: 'getUsersSuccess',
        payload: updatedUsers,
      });

      await axios.put(
        `${URI}/add-user`,
        {followUserId},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      console.log('Error following user:', error);
    }
  };

// unfollow user
export const unfollowUserAction =
  ({userId, users, followUserId}: FollowUnfollowParams) =>
  async (dispatch: Dispatch<any>) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const updatedUsers = users.map((userObj: any) =>
        userObj._id === followUserId
          ? {
              ...userObj,
              followers: userObj.followers.filter(
                (follower: any) => follower.userId !== userId,
              ),
            }
          : userObj,
      );

      // update our users state
      dispatch({
        type: 'getUsersSuccess',
        payload: updatedUsers,
      });

      await axios.put(
        `${URI}/add-user`,
        {followUserId},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      console.log('Error following user:', error);
    }
  };

export const sendFriendRequestAction =
  (currentUserId: string, selectedUserId: string) =>
  async (dispatch: Dispatch<any>) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${URI}/friend-request`,
        {currentUserId, selectedUserId},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      dispatch({
        type: 'sendFriendRequestSuccess',
        payload: selectedUserId,
      });
    } catch (error) {
      console.log('Error sending friend request:', error);
    }
  };

export const acceptFriendRequestAction =
  (senderId: string, recipientId: string) =>
  async (dispatch: Dispatch<any>) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${URI}/friend-request/accept`,
        {senderId, recipientId},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      dispatch({
        type: 'acceptFriendRequestSuccess',
        payload: recipientId,
      });
    } catch (error) {
      console.log('Error accepting friend request:', error);
    }
  };

export const loadFriendRequestsAction =
  (userId: string) => async (dispatch: Dispatch<any>) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const {data} = await axios.get(`${URI}/friend-request/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      dispatch({
        type: 'loadFriendRequestsSuccess',
        payload: data,
      });
    } catch (error) {
      console.log('Error loading friend requests:', error);
    }
  };

export const loadAcceptedFriendsAction =
  (userId: string) => async (dispatch: Dispatch<any>) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const {data} = await axios.get(`${URI}/accepted-friends/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      dispatch({
        type: 'loadAcceptedFriendsSuccess',
        payload: data,
      });
    } catch (error) {
      console.log('Error loading accepted friends:', error);
    }
  };
