import { ApolloClient, InMemoryCache, createHttpLink, split, from, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { useAuthStore } from '@/store/auth.store';

const httpLink = createHttpLink({ uri: '/graphql' });

const authLink = setContext((_, { headers }) => {
  const token = useAuthStore.getState().accessToken;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
  }
  if (networkError) {
    console.error('Network error:', networkError);
  }
});

// Create WebSocket link safely — connection errors are non-fatal
let wsLink: ApolloLink;
try {
  wsLink = new GraphQLWsLink(
    createClient({
      url: `ws://${window.location.host}/graphql`,
      shouldRetry: () => true,
      retryAttempts: 5,
      connectionParams: () => {
        const token = useAuthStore.getState().accessToken;
        return { authorization: token ? `Bearer ${token}` : '' };
      },
      on: {
        error: (err) => console.warn('WS connection error:', err),
      },
    })
  );
} catch {
  // Fallback to HTTP only if WS setup fails
  wsLink = httpLink;
}

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return def.kind === 'OperationDefinition' && def.operation === 'subscription';
  },
  wsLink,
  from([errorLink, authLink, httpLink])
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          outlets: { keyArgs: ['filter', 'sort'] },
          reviews: { keyArgs: ['filter', 'sort'] },
          employees: { keyArgs: ['filter', 'sort'] },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' },
    query: { fetchPolicy: 'network-only', errorPolicy: 'all' },
    mutate: { errorPolicy: 'all' },
  },
});
