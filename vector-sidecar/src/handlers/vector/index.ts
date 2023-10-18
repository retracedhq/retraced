import graphql from '../../lib/graphql';
import * as request from 'request';
import fs from 'fs';
import config from '../../config';
import { getSafeFileName } from '../../lib/helper';
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
      const components = await graphql.getAllComponentsByType(type);
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

export const saveVectorConfig = async (req, res) => {
  const body = req.body;
  let { config: sink, tenant, name } = body;
  console.log(`Config for ${tenant} with name ${name}`);
  const path = `${config.configPath}/${getSafeFileName(tenant, name)}.toml`;
  console.log(`Saving to ${path}`);
  fs.writeFileSync(path, sink);
  res.status(201).json({
    success: true,
  });
};
