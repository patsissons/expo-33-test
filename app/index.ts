import {registerRootComponent} from 'expo';
import {activateKeepAwake} from 'expo-keep-awake';
import {App} from 'components';

if (__DEV__) {
  activateKeepAwake();
}

registerRootComponent(App as any);
