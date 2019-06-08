import firebase from 'firebase/app';
import 'firebase/auth';

export interface Options extends Record<string, any> {
  name?: string;
}

export function useFirebase({name, ...options}: Options = {}) {
  if (!firebase.apps.length) {
    firebase.initializeApp(
      {
        apiKey: 'AIzaSyDjaOdS5nsraljgsuGl-OfjWUdAX5osLkg',
        authDomain: 'expo-33-test.firebaseapp.com',
        databaseURL: 'https://expo-33-test.firebaseio.com',
        projectId: 'expo-33-test',
        storageBucket: '',
        messagingSenderId: '739964473852',
        ...options,
      },
      name,
    );
  }

  return firebase;
}

export function useAuth() {
  const firebase = useFirebase();

  return firebase.auth();
}
