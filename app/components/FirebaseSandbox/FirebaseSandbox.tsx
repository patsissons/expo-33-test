import React, {useEffect, useState, useCallback} from 'react';
import {useMutation, useQuery} from '@shopify/react-graphql';
import {Text} from 'react-native';
import {Card, Avatar, Button, Divider} from 'react-native-elements';
import {Container} from 'components/styled';
import {useAuth} from 'utilities';
import {FieldEditor} from './components';

import itemsQuery from './graphql/ItemsQuery.graphql';
import updateItemMutation from './graphql/UpdateItemMutation.graphql';

interface Item {
  id: string;
  key: string;
}

export function FirebaseSandbox() {
  const [authenticating, setAuthenticating] = useState(false);
  const auth = useAuth();
  const {data, loading, error: queryError} = useQuery<{items: Item[]}>(
    itemsQuery,
  );
  const updateItem = useMutation(updateItemMutation);
  const handleAuth = useCallback(async () => {
    if (auth.currentUser) {
      try {
        setAuthenticating(true);

        await auth.signOut();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Unable to sign out', error);
      } finally {
        setAuthenticating(false);
      }
    } else {
      try {
        setAuthenticating(true);

        await auth.signInAnonymously();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Unable to sign in anonymously', error);
      } finally {
        setAuthenticating(false);
      }
    }
  }, [auth]);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && !user.isAnonymous) {
        // eslint-disable-next-line no-console
        console.log('user authenticated', user);
      }
    });

    handleAuth();

    return unsubscribe;
  }, [auth, handleAuth]);

  function handleUpdateItem(id: string, key: string) {
    return updateItem({
      variables: {input: {id, key}},
    });
  }

  const displayName = auth.currentUser
    ? auth.currentUser.displayName || 'Anonymous'
    : 'Not authenticated';

  return (
    <Card title="Firebox Sandbase">
      <Container style={{flexDirection: 'row'}}>
        {auth.currentUser && (
          <Avatar
            rounded
            containerStyle={{marginRight: 10}}
            title={displayName.slice(0, 1)}
          />
        )}
        <Text>{displayName}</Text>
      </Container>
      <Divider style={{marginTop: 10, marginBottom: 10}} />
      <Button
        loading={authenticating}
        onPress={handleAuth}
        title={auth.currentUser ? 'Logout' : 'Login'}
      />
      <Container>
        {loading && <Text>Loading items...</Text>}
        {queryError && <Text style={{color: 'red'}}>{queryError.message}</Text>}
        {data &&
          data.items &&
          data.items.map(({id, key}: any) => {
            return (
              <FieldEditor
                key={id}
                id={id}
                name="key"
                value={key}
                onSave={handleUpdateItem}
              />
            );
          })}
      </Container>
    </Card>
  );
}
