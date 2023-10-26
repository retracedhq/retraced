import graphql from '../../services/graphql';
import * as request from 'request';
import config from '../../config';
import { ConfigManager } from '../../services/configManager';
import { processConfig, setSinkAsActive, verifyVectorConfig } from '../../services/vector';
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
    const { sourceName, sinkName } = await processConfig(tenant, name, sink);
    let verified = await verifyVectorConfig(sourceName, sinkName);
    await setSinkAsActive(sink.id);
    res.status(201).json({
      success: true,
      verified,
      sourceName,
      sinkName,
    });
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
