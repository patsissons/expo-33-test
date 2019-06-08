import {firestore} from 'firebase/app';
import 'firebase/firestore';
import {FirestoreLink} from './FirestoreLink';

export function createFirestoreLink(store: firestore.Firestore) {
  return new FirestoreLink(store);
}
