const config = {
  configPath: '/etc/vector/config',
  vectorAPIPort: +(process.env.VECTOR_API_PORT || '8686'),
  port: +(process.env.PORT || '3003'),
  graphQLSubscriptionInterval: +(process.env.GRAPHQL_SUBSCRIPTION_INTERVAL || '1000'),
};

export default config;
