import axios from 'axios';
import {URI} from '../URI';
import {Dispatch} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// create pin
export const createPinAction =
  (
    createdBy: object,
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
          createdBy,
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

export const deletePinAction =
  (pinId: string) => async (dispatch: Dispatch<any>) => {
    console.log('trying to delete pin');

    try {
      dispatch({
        type: 'pinDeleteRequest',
      });

      const token = await AsyncStorage.getItem('token');

      await axios.delete(`${URI}/delete-pin/${pinId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch({
        type: 'pinDeleteSuccess',
        payload: pinId,
      });
    } catch (error: any) {
      dispatch({
        type: 'pinDeleteFailed',
        payload: error.response.data.message,
      });
    }
  };
