import React, {ReactNode} from 'react';
import {ApolloProvider} from '@shopify/react-graphql';
import {useClient} from 'utilities/apollo';

interface Props {
  children?: ReactNode;
}

export function AppContainer({children}: Props) {
  const client = useClient();

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
