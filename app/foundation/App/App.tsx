import React from 'react';
import {StyleSheet} from 'react-native';
import {FirebaseSandbox} from 'components';
import {Container} from 'components/styled';
import {AppContainer} from './components';

export function App() {
  return (
    <Container style={styles.app}>
      <AppContainer>
        <FirebaseSandbox />
      </AppContainer>
    </Container>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: '#ddd',
  },
});
