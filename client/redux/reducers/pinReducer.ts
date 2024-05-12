import {createReducer} from '@reduxjs/toolkit';

const initialState = {
  pins: [],
  pin: {},
  error: null,
  isSuccess: false,
  isLoading: true,
};

export const pinReducer = createReducer(initialState, {
  pinCreateRequest: state => {
    state.isLoading = true;
  },
  pinCreateSuccess: (state, action) => {
    state.isLoading = false;
    state.pin = action.payload;
    state.isSuccess = true;
  },
  pinCreateFailed: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
  },
  getAllPinsRequest: state => {
    state.isLoading = true;
  },
  getAllPinsSuccess: (state, action) => {
    state.isLoading = false;
    state.pins = action.payload;
  },
  getAllPinsFailed: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
  },
  clearErrors: state => {
    state.error = null;
  },
});
