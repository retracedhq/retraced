import express from 'express';
import setupRoutes from './routes';
import config from './config';
import { ConfigManager } from './lib/configManager';

ConfigManager.init();

const app = express();
app.use(express.json());

setupRoutes(app);

app.listen(config.port, () => {
  console.log(`Vector Management API listening at http://localhost:${config.port}`);
});

// detect CTRL-C and gracefully exit
process.on('SIGINT', () => {
  console.log('Closing');
  process.exit();
});
