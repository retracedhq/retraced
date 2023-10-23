import healthcheck from './handlers/healthcheck';
import {
  getAllComponents,
  getHealth,
  saveVectorConfig,
  getAvailablePort,
  getComponentsByName,
} from './handlers';

export default function setupRoutes(app) {
  app.get('/api/v1/health', healthcheck);

  app.get('/api/v1/vector/health', getHealth);

  app.get('/api/v1/vector/components', getAllComponents);

  app.get('/api/v1/vector/component/:name', getComponentsByName);

  app.get('/api/v1/vector/config/available-port', getAvailablePort);

  app.post('/api/v1/vector/config', saveVectorConfig);
}
