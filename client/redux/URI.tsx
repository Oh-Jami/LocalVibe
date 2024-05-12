import {Platform} from 'react-native';

let URI = '';

if (Platform.OS === 'ios') {
  URI = 'https://local-vibe-aoalujkmw-code-house.vercel.app/api/v1';
} else {
  URI = 'https://local-vibe-aoalujkmw-code-house.vercel.app/api/v1';
}

export {URI};
