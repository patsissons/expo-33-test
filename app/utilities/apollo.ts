import {useState} from 'react';
import {InMemoryCache} from 'apollo-cache-inmemory';
import {ApolloClient, ApolloClientOptions} from 'apollo-client';
import {ApolloLink} from 'apollo-link';
import {createFirestoreLink} from 'apollo-link-firestore';
import {useFirebase} from './firebase';

interface Options extends Omit<ApolloClientOptions<any>, 'link'> {
  link?:
    | ApolloLink
    | ((firestoreLink: ReturnType<typeof createFirestoreLink>) => ApolloLink);
}

export function useClient(
  {link, ...options}: Options = {
    cache: new InMemoryCache(),
  },
) {
  const firebase = useFirebase();
  const [client] = useState(
    () =>
      new ApolloClient({
        ...options,
        link: createLink(),
      }),
  );

  function createLink() {
    const firestoreLink = createFirestoreLink(firebase.firestore());

    if (!link) {
      return firestoreLink;
    }

    if (typeof link === 'function') {
      return link(firestoreLink);
    }

    return firestoreLink.concat(link);
  }

  return client;
}
