import axios from 'axios';
import {URI} from '../URI';
import {Dispatch} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// create pin
export const createPinAction =
  (
    businessName: string,
    description: string,
    category: string,
    latitude: number,
    longitude: number,
    contactInfo: {phone?: string; email?: string; website?: string},
    image: string,
  ) =>
  async (dispatch: Dispatch<any>) => {
    try {
      dispatch({
        type: 'pinCreateRequest',
      });

      const token = await AsyncStorage.getItem('token');

      const {data} = await axios.post(
        `${URI}/create-pin`,
        {
          businessName,
          description,
          category,
          latitude,
          longitude,
          contactInfo,
          image,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      dispatch({
        type: 'pinCreateSuccess',
        payload: data.pin,
      });
    } catch (error: any) {
      dispatch({
        type: 'pinCreateFailed',
        payload: error.response.data.message,
      });
    }
  };

// get all pins
export const getAllPins = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch({
      type: 'getAllPinsRequest',
    });

    const token = await AsyncStorage.getItem('token');

    const {data} = await axios.get(`${URI}/get-all-pins`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    dispatch({
      type: 'getAllPinsSuccess',
      payload: data.pins,
    });
  } catch (error: any) {
    dispatch({
      type: 'getAllPinsFailed',
      payload: error.response.data.message,
    });
  }
};

// add likes to pin
export const addLikesToPin =
  ({pinId, pins, user}: any) =>
  async (dispatch: Dispatch<any>) => {
    try {
      const token = await AsyncStorage.getItem('token');

      const updatedPins = pins.map((pin: any) =>
        pin._id === pinId
          ? {
              ...pin,
              likes: [
                ...pin.likes,
                {
                  userName: user.name,
                  userId: user._id,
                  userAvatar: user.avatar.url,
                  pinId,
                },
              ],
            }
          : pin,
      );

      dispatch({
        type: 'getAllPinsSuccess',
        payload: updatedPins,
      });

      await axios.put(
        `${URI}/update-likes-pin`,
        {pinId},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error: any) {
      console.error('Error adding likes to pin:', error);
    }
  };

// remove likes from pin
export const removeLikesFromPin =
  ({pinId, pins, user}: any) =>
  async (dispatch: Dispatch<any>) => {
    try {
      const token = await AsyncStorage.getItem('token');

      const updatedPins = pins.map((pin: any) =>
        pin._id === pinId
          ? {
              ...pin,
              likes: pin.likes.filter((like: any) => like.userId !== user._id),
            }
          : pin,
      );
      dispatch({
        type: 'getAllPinsSuccess',
        payload: updatedPins,
      });

      await axios.put(
        `${URI}/update-likes-pin`,
        {pinId},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error: any) {
      console.error('Error removing likes from pin:', error);
    }
  };
