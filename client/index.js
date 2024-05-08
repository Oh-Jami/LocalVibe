/**
 * @format
 */

import {AppRegistry, LogBox } from 'react-native';
import App from './App';
import {name as appName} from './app.json';

LogBox.ignoreLogs(['Found screens with the same name nested inside one another']);
LogBox.ignoreLogs(['In React 18, SSRProvider is not necessary and is a noop. You can remove it from your app.']);
LogBox.ignoreLogs(['The object notation for `createReducer` is deprecated, and will be removed in RTK 2.0.']);
LogBox.ignoreLogs(['source.uri should not be an empty string']);
LogBox.ignoreLogs(['Non-serializable values were found in the navigation state.']);
LogBox.ignoreLogs(['Possible Unhandled Promise Rejection (id: 0):']);
LogBox.ignoreLogs(['Possible Unhandled Promise Rejection (id: 1):']);
LogBox.ignoreLogs(['Warning: Failed prop type: Invalid prop `value` of type `number` supplied to `TextInput`, expected `string`.']);
LogBox.ignoreLogs([/ReactImageView: Image source "" doesn't exist/]);
LogBox.ignoreLogs([/ReactImageView: Image source "null" doesn't exist/]);
LogBox.ignoreLogs([/The action 'NAVIGATE' with payload {"name":"Home"} was not handled by any navigator./]);


AppRegistry.registerComponent(appName, () => App);
