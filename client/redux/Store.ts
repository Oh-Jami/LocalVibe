import {configureStore} from '@reduxjs/toolkit';
import {userReducer} from './reducers/userReducer';
import {postReducer} from './reducers/postReducer';
import {notificationReducer} from './reducers/notificationReducer';
import {pinReducer} from './reducers/pinReducer';

const Store = configureStore({
  reducer: {
    user: userReducer,
    post: postReducer,
    pin: pinReducer,
    notification: notificationReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }),
});

export default Store;
