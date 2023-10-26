const config = {
  configPath: '/etc/vector/config',
  vectorAPIPort: +(process.env.VECTOR_API_PORT || '8686'),
  port: +(process.env.PORT || '3003'),
  graphQLSubscriptionInterval: +(process.env.GRAPHQL_SUBSCRIPTION_INTERVAL || '1000'),
  NSQD_HOST: process.env.NSQD_HOST || '',
  NSQD_TCP_PORT: +(process.env.NSQD_TCP_PORT || '4150'),
  NSQD_HTTP_PORT: +(process.env.NSQD_HTTP_PORT || '4151'),
  POSTGRES_USER: process.env.POSTGRES_USER || '',
  POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || '',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || '',
  POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
  POSTGRES_PORT: +(process.env.POSTGRES_PORT || '5432'),
  POSTGRES_POOL_SIZE: +(process.env.POSTGRES_POOL_SIZE || '20'),
  PUBLISHER_CREATE_EVENT_TIMEOUT: +(process.env.PUBLISHER_CREATE_EVENT_TIMEOUT || '2000'),
};

export default config;
