import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { Buffer } from 'buffer';
import { AppRegistry } from 'react-native';
import App from './src/app/App';

global.Buffer = global.Buffer || Buffer;
AppRegistry.registerComponent('X32BusAuxControl', () => App);
