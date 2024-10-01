import dotenv from "dotenv";
const env: any = dotenv.config().parsed;

export default {
  POSTGRES_HOST: process.env.POSTGRES_HOST || env.POSTGRES_HOST || "localhost",
  HMAC_SECRET_ADMIN: process.env.HMAC_SECRET_ADMIN || env.HMAC_SECRET_ADMIN || "xxxxxxxxxx",
  NSQD_HTTP_PORT: process.env.NSQD_HTTP_PORT || env.NSQD_HTTP_PORT || 4151,
  SHLVL: process.env.SHLVL || env.SHLVL,
  POSTGRES_USER: process.env.POSTGRES_USER || env.POSTGRES_USER,
  EXPORT_PAGE_SIZE_INTERNAL: process.env.EXPORT_PAGE_SIZE_INTERNAL || env.EXPORT_PAGE_SIZE_INTERNAL || 10000,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || env.POSTGRES_PASSWORD,
  POSTGRES_POOL_SIZE: process.env.POSTGRES_POOL_SIZE || env.POSTGRES_POOL_SIZE || 20,
  POSTGRES_SSL: process.env.POSTGRES_SSL || env.POSTGRES_SSL,
  HMAC_SECRET_VIEWER: process.env.HMAC_SECRET_VIEWER || env.HMAC_SECRET_VIEWER,
  POSTGRES_PORT: process.env.POSTGRES_PORT || env.POSTGRES_PORT,
  API_BASE_URL_PATH: process.env.API_BASE_URL_PATH || env.API_BASE_URL_PATH,
  RETRACED_API_BASE: process.env.RETRACED_API_BASE || env.RETRACED_API_BASE || "localhost:3000",
  POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || env.POSTGRES_DATABASE,
  LOG_LEVEL: process.env.LOG_LEVEL || env.LOG_LEVEL || "warn",
  ELASTICSEARCH_NODES: process.env.ELASTICSEARCH_NODES || env.ELASTICSEARCH_NODES,
  NSQD_HOST: process.env.NSQD_HOST || env.NSQD_HOST,
  HOSTNAME: process.env.HOSTNAME || env.HOSTNAME,
  NSQD_TCP_PORT: process.env.NSQD_TCP_PORT || env.NSQD_TCP_PORT || 4150,
  PG_SEARCH: process.env.PG_SEARCH || env.PG_SEARCH || undefined,
  HEADLESS_ENV_ID: process.env.HEADLESS_ENV_ID || env.HEADLESS_ENV_ID,
  HEADLESS_API_KEY: process.env.HEADLESS_API_KEY || env.HEADLESS_API_KEY,
  HEADLESS_PROJECT_ID: process.env.HEADLESS_PROJECT_ID || env.HEADLESS_PROJECT_ID,
  BUGSNAG_TOKEN: process.env.BUGSNAG_TOKEN || env.BUGSNAG_TOKEN,
  STAGE: process.env.STAGE || env.STAGE,
  ADMIN_ROOT_TOKEN: process.env.ADMIN_ROOT_TOKEN || env.ADMIN_ROOT_TOKEN,
  SSL_SERVER_CERT_PATH: process.env.SSL_SERVER_CERT_PATH || env.SSL_SERVER_CERT_PATH,
  SSL_SERVER_KEY_PATH: process.env.SSL_SERVER_KEY_PATH || env.SSL_SERVER_KEY_PATH,
  RETRACED_API_LOG_FILE: process.env.RETRACED_API_LOG_FILE || env.RETRACED_API_LOG_FILE,
  RETRACED_API_SCHEMES: process.env.RETRACED_API_SCHEMES || env.RETRACED_API_SCHEMES,
  KUBERNETES_SERVICE_HOST: process.env.KUBERNETES_SERVICE_HOST || env.KUBERNETES_SERVICE_HOST,
  RETRACED_DB_NO_CACHE: process.env.RETRACED_DB_NO_CACHE || env.RETRACED_DB_NO_CACHE,
  ELASTICSEARCH_CAFILE: process.env.ELASTICSEARCH_CAFILE || env.ELASTICSEARCH_CAFILE,
  ELASTICSEARCH_CACERT: process.env.ELASTICSEARCH_CACERT || env.ELASTICSEARCH_CACERT,
  HEADLESS_PROJECT_ENV: process.env.HEADLESS_PROJECT_ENV || env.HEADLESS_PROJECT_ENV,
  RETRACED_PROCESSOR_LOG_FILE: process.env.RETRACED_PROCESSOR_LOG_FILE || env.RETRACED_PROCESSOR_LOG_FILE,
  ELASTICSEARCH_REQUEST_RETRIES:
    process.env.ELASTICSEARCH_REQUEST_RETRIES || env.ELASTICSEARCH_REQUEST_RETRIES,
  ELASTICSEARCH_REQUEST_TIMEOUT:
    process.env.ELASTICSEARCH_REQUEST_TIMEOUT || env.ELASTICSEARCH_REQUEST_TIMEOUT,
  ELASTICSEARCH_BACKOFF: process.env.ELASTICSEARCH_BACKOFF || env.ELASTICSEARCH_BACKOFF,
  ELASTICSEARCH_TOTAL_TIMEOUT: process.env.ELASTICSEARCH_TOTAL_TIMEOUT || env.ELASTICSEARCH_TOTAL_TIMEOUT,
  REDIS_URI: process.env.REDIS_URI || env.REDIS_URI,
  EMAIL_FROM: process.env.EMAIL_FROM || env.EMAIL_FROM,
  SMTP_CONNECTION_URL: process.env.SMTP_CONNECTION_URL || env.SMTP_CONNECTION_URL,
  MANDRILL_KEY: process.env.MANDRILL_KEY || env.MANDRILL_KEY,
  PROCESSOR_NORMALIZE_REPAIRER_MIN_AGE_MS:
    process.env.PROCESSOR_NORMALIZE_REPAIRER_MIN_AGE_MS || env.PROCESSOR_NORMALIZE_REPAIRER_MIN_AGE_MS,
  PROCESSOR_NORMALIZE_REPAIRER_MAX_EVENTS:
    process.env.PROCESSOR_NORMALIZE_REPAIRER_MAX_EVENTS || env.PROCESSOR_NORMALIZE_REPAIRER_MAX_EVENTS,
  WARP_PIPE_REDIS_DB: process.env.WARP_PIPE_REDIS_DB || env.WARP_PIPE_REDIS_DB,
  TMPDIR: process.env.TMPDIR || env.TMPDIR,
  PUBLISHER_BULK_CREATE_MAX_EVENTS:
    process.env.PUBLISHER_BULK_CREATE_MAX_EVENTS || env.PUBLISHER_BULK_CREATE_MAX_EVENTS,
  PUBLISHER_CREATE_EVENT_TIMEOUT:
    process.env.PUBLISHER_CREATE_EVENT_TIMEOUT || env.PUBLISHER_CREATE_EVENT_TIMEOUT,
  RETRACED_APP_BASE: process.env.RETRACED_APP_BASE || env.RETRACED_APP_BASE,
  SEGMENT_WRITE_KEY: process.env.SEGMENT_WRITE_KEY || env.SEGMENT_WRITE_KEY,
  NSQ_CIRCUIT_BREAKER_THRESHOLD:
    process.env.NSQ_CIRCUIT_BREAKER_THRESHOLD || env.NSQ_CIRCUIT_BREAKER_THRESHOLD,
  GEOIPUPDATE_LICENSE_KEY:
    process.env.GEOIPUPDATE_LICENSE_KEY ||
    env.GEOIPUPDATE_LICENSE_KEY ||
    process.env.MAXMIND_GEOLITE2_LICENSE_KEY ||
    env.MAXMIND_GEOLITE2_LICENSE_KEY,
  RETRACED_DISABLE_GEOSYNC: process.env.RETRACED_DISABLE_GEOSYNC || env.RETRACED_DISABLE_GEOSYNC,
  RETRACED_NO_ANALYTICS:
    process.env.RETRACED_NO_ANALYTICS ||
    env.RETRACED_NO_ANALYTICS ||
    process.env.DO_NOT_TRACK ||
    env.DO_NOT_TRACK,
  GEOIPUPDATE_USE_MMDB: process.env.GEOIPUPDATE_USE_MMDB || env.GEOIPUPDATE_USE_MMDB,
  GEOIPUPDATE_DB_DIR: process.env.GEOIPUPDATE_DB_DIR || env.GEOIPUPDATE_DB_DIR || "/etc/mmdb",
};
