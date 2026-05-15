import 'react-native-gesture-handler';
import { Buffer } from 'buffer';
import { AppRegistry } from 'react-native';
import App from './src/app/App';
import { disableProductionLogs } from './src/shared/utils/disableProductionLogs';

global.Buffer = global.Buffer || Buffer;
disableProductionLogs();
AppRegistry.registerComponent('X32BusAuxControl', () => App);
