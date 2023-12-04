import graphql from "../../services/graphql";
import axios from "axios";
import config from "../../../../config";
import { ConfigManager } from "../../services/configManager";
import { processConfig, setSinkAsActive, verifyVectorConfig } from "../../services/vector";
import { logger } from "../../../../logger";
// import { reloadConfig } from '../../lib/signal';

export const getHealth = (req, res) => {
  logger.info("Vector health check");
  const url = `${config.VECTOR_HOST_PROTOCOL}://${config.VECTOR_HOST}:${config.VECTOR_API_PORT}/health`;

  axios
    .get(url)
    .then((response) => {
      const data = response.data;
      res.status(200).json({ success: data.ok });
    })
    .catch((err) => {
      logger.error(err);
      res.status(500).json(err);
    });
};

export const getAllComponents = async (req, res) => {
  try {
    if (req.query?.type) {
      const type = req.query.type;
      const components = await graphql.getAllComponentsByType(type.toUpperCase());
      res.status(200).json(components);
    } else {
      const components = await graphql.getAllComponents();
      res.status(200).json(components);
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json(err);
  }
};

export const getComponentsByName = async (req, res) => {
  try {
    if (req.params?.name) {
      const name = req.params.name;
      const components = await graphql.getComponentByName(name);
      res.status(200).json(components);
    } else {
      throw new Error("Missing name");
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json(err);
  }
};

export const saveVectorConfig = async (req, res) => {
  try {
    const body = req.body;
    const { config: sink, tenant, name, id } = body;
    const { sourceName, sinkName } = processConfig(tenant, name, sink, id);
    const verified = await verifyVectorConfig(sourceName, sinkName);
    await setSinkAsActive(sink.id);
    res.status(201).json({
      success: true,
      verified,
      sourceName,
      sinkName,
    });
  } catch (ex) {
    logger.error(ex);
    res.status(500).json(ex);
  }
};

export const getAvailablePort = (req, res) => {
  try {
    const port = ConfigManager.getInstance().findAvailableSourcePort();
    if (!port) {
      throw new Error("No available port");
    }
    res.status(200).json({ port });
  } catch (err) {
    logger.error(err);
    res.status(500).json(err);
  }
};
