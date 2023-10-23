import graphql from '../../services/graphql';
import * as request from 'request';
import fs from 'fs';
import config from '../../config';
import { getSafeFileName, sleep } from '../../services/helper';
import { ConfigManager } from '../../services/configManager';
// import { reloadConfig } from '../../lib/signal';

export const getHealth = (req, res) => {
  console.log('Vector health check');
  request.get(`http://localhost:${config.vectorAPIPort}/health`, (err, response, body) => {
    if (err) {
      console.log(err);
      res.status(500).json(err);
    } else {
      console.log(body);
      res.status(200).json({ success: JSON.parse(body).ok });
    }
  });
};

export const getAllComponents = async (req, res) => {
  try {
    console.log('Vector components');
    if (req.query?.type) {
      const type = req.query.type;
      const components = await graphql.getAllComponentsByType(type.toUpperCase());
      res.status(200).json(components);
    } else {
      const components = await graphql.getAllComponents();
      res.status(200).json(components);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

export const getComponentsByName = async (req, res) => {
  try {
    console.log('Vector component by name');
    if (req.params?.name) {
      const name = req.params.name;
      const components = await graphql.getComponentByName(name);
      res.status(200).json(components);
    } else {
      throw new Error('Missing name');
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

export const saveVectorConfig = async (req, res) => {
  try {
    const body = req.body;
    let { config: sink, tenant, name } = body;
    const sourceName = `source_webhook_${tenant}_${name}`;
    const sinkName = `sink_${tenant}_${name}`;
    console.log(`Config for ${tenant} with name ${name}`);
    const path = `${config.configPath}/${getSafeFileName(tenant, name)}.json`;
    let port;
    const configManager = ConfigManager.getInstance();
    if (configManager.configs[sourceName]) {
      port = configManager.configs[sourceName].sourceHttpPort;
    } else {
      port = configManager.findAvailableSourcePort();
    }
    if (!port) {
      throw new Error('No available port');
    } else {
      const source = {
        [sourceName]: {
          type: 'http_server',
          address: `0.0.0.0:${port}`,
          healthcheck: true,
        },
      };
      const finalConfig = {
        sources: source,
        sinks: {
          [sinkName]: {
            ...sink,
            inputs: [sourceName],
          },
        },
      };
      console.log(`Saving to ${path}`);
      fs.writeFileSync(path, JSON.stringify(finalConfig));
      ConfigManager.getInstance().addConfig({
        configPath: path,
        sourceHttpPort: port,
        sourceName,
      });
      let retries = 0,
        verified = false;
      do {
        try {
          await sleep(1000);
          console.log('Waiting for vector to reload');
          const sinkExists = await graphql.getComponentByName(sinkName);
          const sourceExists = await graphql.getComponentByName(sourceName);
          if (sinkExists && sourceExists) {
            console.log('Vector reloaded');
            verified = true;
            break;
          }
          retries++;
        } catch (ex) {
          retries++;
          console.log(ex);
        }
      } while (retries < 3);
      res.status(201).json({
        success: true,
        verified,
      });
    }
  } catch (ex) {
    console.log(ex);
    res.status(500).json(ex);
  }
};

export const getAvailablePort = async (req, res) => {
  try {
    const port = ConfigManager.getInstance().findAvailableSourcePort();
    if (!port) {
      throw new Error('No available port');
    }
    res.status(200).json({ port });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
