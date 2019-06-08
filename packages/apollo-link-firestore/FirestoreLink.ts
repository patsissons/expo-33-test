import {
  ApolloLink,
  Observable,
  FetchResult,
  Operation,
  NextLink,
} from 'apollo-link';
import {addTypenameToDocument, getMainDefinition} from 'apollo-utilities';
import {firestore} from 'firebase/app';
import {OperationTypeNode, DocumentNode} from 'graphql';
import {visit} from 'graphql/language';
import {Resolver} from 'graphql-anywhere';
import {graphql} from 'graphql-anywhere/lib/async';
import {mutationResolver} from './mutationResolver';
import {queryResolver} from './queryResolver';
import {
  QueryResolverContext,
  ResolverRoot,
  OnSnapshotSubscriber,
} from './types';

type RequestContext = ReturnType<typeof requestContext>;

export class FirestoreLink extends ApolloLink {
  constructor(protected readonly store: firestore.Firestore) {
    super();
  }

  public request(operation: Operation, forward?: NextLink) {
    const context = requestContext(this.store, operation);

    if (!isFirestoreQuery(context.mainDefinition) && forward) {
      return forward(operation);
    }

    return this.observeQuery(operation, context);
  }

  protected getResolver(operationType: OperationTypeNode) {
    return resolverForOperationType(operationType);
  }

  protected observeQuery(
    {variables, query}: Operation,
    {
      context,
      mainDefinition,
      operationType,
      queryWithTypename,
      resolverRoot,
    }: RequestContext,
  ): Observable<FetchResult> {
    return new Observable((observer) => {
      const resolver = this.getResolver(operationType);
      const subscribe = hasSubscribeDirective(query);
      let subscribed = false;

      function refreshGraphQL(
        single: boolean,
        onSnapshot?: OnSnapshotSubscriber,
      ) {
        // eslint-disable-next-line no-console
        console.log(
          `invoking GraphQL ${operationType}${
            single ? ' Once' : ''
          }${mainDefinition.name && `: ${mainDefinition.name.value}`}`,
        );

        graphql(
          resolver,
          queryWithTypename,
          resolverRoot,
          {...context, onSnapshot},
          variables,
        )
          .then((data) => {
            if (!data) {
              throw new Error('null?');
            }

            observer.next({data});

            if (single) {
              observer.complete();
            }

            // wait until after the first response to enable the subscription
            subscribed = true;
          })
          .catch((err) => {
            if (err.name === 'AbortError') {
              return;
            }

            if (err.result && err.result.errors) {
              observer.next(err.result);
            }

            observer.error(err);
          });
      }

      refreshGraphQL(
        !subscribe,
        subscribe
          ? {
              ...observer,
              next(snapshot) {
                // eslint-disable-next-line no-console
                console.log('snapshot updated', snapshot);

                if (subscribed) {
                  refreshGraphQL(false);
                }
              },
            }
          : undefined,
      );
    });
  }
}

function resolverForOperationType(operationType: OperationTypeNode): Resolver {
  switch (operationType) {
    case 'query':
    case 'subscription':
      return queryResolver;
    case 'mutation':
      return mutationResolver;
    default:
      throw new Error(`${operationType} not supported`);
  }
}

function isFirestoreQuery(
  mainDefinition: ReturnType<typeof getMainDefinition>,
) {
  return (
    mainDefinition.kind === 'OperationDefinition' &&
    mainDefinition.directives &&
    mainDefinition.directives.some(({name: {value}}) =>
      ['query', 'mutation'].includes(value),
    )
  );
}

function requestContext(store: firestore.Firestore, {query}: Operation) {
  const mainDefinition = getMainDefinition(query);
  const operationType: OperationTypeNode =
    mainDefinition.kind === 'OperationDefinition'
      ? mainDefinition.operation
      : 'query';

  return {
    context: {
      store,
      fields: {},
    } as QueryResolverContext,
    operationType,
    mainDefinition,
    queryWithTypename: addTypenameToDocument(query),
    resolverRoot: {} as ResolverRoot,
  };
}

export function hasSubscribeDirective(query: DocumentNode) {
  let subscribe = false;

  visit(query, {
    Directive(directive) {
      if (
        !subscribe &&
        directive.name.value === 'query' &&
        directive.arguments &&
        directive.arguments.some(
          ({name, value}) =>
            name.value === 'subscribe' &&
            value.kind === 'BooleanValue' &&
            value.value,
        )
      ) {
        subscribe = true;
      }
    },
  });

  return subscribe;
}
