const config = {
  CONFIG_PATH: "/etc/vector/config",
  VECTOR_API_PORT: +(process.env.VECTOR_API_PORT || "8686"),
  PORT: +(process.env.PORT || "3003"),
  GRAPHQL_SUBSCRIPTION_INTERVAL: +(process.env.GRAPHQL_SUBSCRIPTION_INTERVAL || "15000"),
  NSQD_HOST: process.env.NSQD_HOST || "localhost",
  NSQD_TCP_PORT: +(process.env.NSQD_TCP_PORT || "4150"),
  NSQD_HTTP_PORT: +(process.env.NSQD_HTTP_PORT || "4151"),
  POSTGRES_USER: process.env.POSTGRES_USER || "retraced",
  POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || "retraced",
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || "password",
  POSTGRES_HOST: process.env.POSTGRES_HOST || "localhost",
  POSTGRES_PORT: +(process.env.POSTGRES_PORT || "5432"),
  POSTGRES_POOL_SIZE: +(process.env.POSTGRES_POOL_SIZE || "20"),
  PUBLISHER_CREATE_EVENT_TIMEOUT: +(process.env.PUBLISHER_CREATE_EVENT_TIMEOUT || "2000"),
  PG_SEARCH: !!process.env.PG_SEARCH || false,
  MODE: process.env.MODE || "sidecar",
};

export default config;
