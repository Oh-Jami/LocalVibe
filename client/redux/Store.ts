import {configureStore} from '@reduxjs/toolkit';
import {userReducer} from './reducers/userReducer';
import {postReducer} from './reducers/postReducer';
import {notificationReducer} from './reducers/notificationReducer';
import {pinReducer} from './reducers/pinReducer';

const store = configureStore({
  reducer: {
    user: userReducer,
    post: postReducer,
    pin: pinReducer,
    notification: notificationReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      thunk: true, // Ensure Redux Thunk middleware is enabled
      serializableCheck: false, // Disable serializableCheck
    }),
});

export default store;
