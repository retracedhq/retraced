import healthcheck from './handlers/healthcheck';
import { getAllComponents, getHealth, saveVectorConfig } from './handlers';

export default function setupRoutes(app) {
  app.get('/api/v1/health', healthcheck);

  app.get('/api/v1/vector/health', getHealth);

  app.get('/api/v1/vector/components', getAllComponents);

  app.post('/api/v1/vector/config', saveVectorConfig);
}
