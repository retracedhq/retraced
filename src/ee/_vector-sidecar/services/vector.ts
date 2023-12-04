import fs from "fs";

import { ConfigManager } from "./configManager";
import { getVectorConfig, getVectorConfigPath, sleep } from "./helper";
import getPgPool from "../../../_db/persistence/pg";
import graphql from "./graphql";
import { logger } from "../../../logger";

export const getSourceName = (tenant, name) => {
  return `source_webhook_${tenant}_${name}`;
};

export const getSinkName = (tenant, name) => {
  return `sink_${tenant}_${name}`;
};

export const processConfig = (
  tenant: string,
  name: string,
  sink: any,
  id: string
): {
  sourceName: string;
  sinkName: string;
} => {
  const sourceName = getSourceName(tenant, name);
  const sinkName = getSinkName(tenant, name);
  logger.info(`Config for ${tenant} with name ${name}`);
  const path = getVectorConfigPath(id);
  let port;
  const configManager = ConfigManager.getInstance();
  if (configManager.configs[id]) {
    port = configManager.configs[id].sourceHttpPort;
  } else {
    port = configManager.findAvailableSourcePort();
  }
  if (!port) {
    throw new Error("No available port");
  } else {
    const finalConfig = getVectorConfig(sourceName, port, sinkName, sink);
    logger.info(`Saving to ${path}`);
    fs.writeFileSync(path, JSON.stringify(finalConfig));
    ConfigManager.getInstance().addConfig({
      configPath: path,
      sourceHttpPort: port,
      sourceName,
      sinkName,
      id,
    });
    return { sourceName, sinkName };
  }
};

export const addConfigFromSinkRow = async (sinkRow, verify = true) => {
  const { project_id, name, environment_id, group_id, config: sinkConfig, id } = sinkRow;
  const tenant = `${project_id}_${environment_id}_${group_id}`;
  const configManager = ConfigManager.getInstance();
  if (configManager.configs[sinkRow.id]) {
    logger.info(`Source already exists`);
    return;
  } else {
    logger.info(`Source does not exist, adding config`);
    const { sourceName, sinkName } = processConfig(tenant, name, sinkConfig, id);
    if (verify) {
      const verified = await verifyVectorConfig(sourceName, sinkName);
      logger.info(`Verified: ${verified}`);
    }
    await setSinkAsActive(sinkRow.id);
  }
};

export const handleSinkCreated = async (sink) => {
  const pg = getPgPool();
  logger.info(`Sink created: `, sink);
  const res = await pg.query(`SELECT * FROM vectorsink where id=$1`, [sink.id]);
  if (res.rows.length === 0) {
    logger.info(`Sink not found`);
  } else {
    logger.info(`Sink found`);
    const sinkRow = res.rows[0];
    await addConfigFromSinkRow(sinkRow);
  }
};

export const handleSinkUpdated = async (sink) => {
  /**
   * 1. Fetch sink from db
   * 2. If it exists, check if we have the config in ConfigManager by sink id
   * 3. If we have the config, update the config
   * 4. If we don't have it, we will create the config
   */
  const pg = getPgPool();
  logger.info(`Sink updated: `, sink);
  const res = await pg.query(`SELECT * FROM vectorsink where id=$1`, [sink.id]);
  if (res.rows.length === 0) {
    logger.info(`Sink not found`);
  } else {
    logger.info(`Sink found`);
    const sinkRow = res.rows[0];
    const { project_id, name, environment_id, group_id, config: _config, id } = sinkRow;
    const tenant = `${project_id}_${environment_id}_${group_id}`;
    const configManager = ConfigManager.getInstance();
    const currentConfig = configManager.getConfigBySinkId(sink.id);
    if (!currentConfig) {
      // create new config
      logger.info(`Source does not exist, adding config`);
      const { sourceName, sinkName } = processConfig(tenant, name, _config, id);
      const verified = await verifyVectorConfig(sourceName, sinkName);
      logger.info(`Verified: ${verified}`);
      await setSinkAsActive(sink.id);
    } else {
      // update existing config
      logger.info(`Source already exists`);
      const sourceName = getSourceName(tenant, name);
      const sinkName = getSinkName(tenant, name);
      const newConfig = getVectorConfig(sourceName, currentConfig.sourceHttpPort, sinkName, _config);
      const path = getVectorConfigPath(sink.id);
      if (path !== currentConfig.configPath) {
        fs.unlinkSync(currentConfig.configPath);
      }
      fs.writeFileSync(path, JSON.stringify(newConfig));
      const verified = await verifyVectorConfig(sourceName, sinkName);
      logger.info(`Verified: ${verified}`);
      if (currentConfig.sourceName !== sourceName) {
        delete configManager.configs[id];
      }
      configManager.addConfig({
        configPath: path,
        sourceHttpPort: currentConfig.sourceHttpPort,
        sourceName,
        sinkName,
        id,
      });
      await setSinkAsActive(sink.id);
    }
  }
};

export const handleSinkDeleted = (sink) => {
  const instance = ConfigManager.getInstance();
  const sinkConfig = Object.values(instance.configs).find((c) => c.id === sink.id);
  const configPath = sinkConfig?.configPath || getVectorConfigPath(sink.id);
  if (sinkConfig) {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    delete instance.configs[sink.id];
    logger.info(`Config deleted`);
  } else if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
    logger.info(`Config deleted`);
  } else {
    logger.info(`Config not found`);
  }
};

export const setSinkAsActive = async (sinkId) => {
  const pg = getPgPool();
  await pg.query(`UPDATE vectorsink SET active=true where id=$1`, [sinkId]);
};

export const verifyVectorConfig = async (sourceName, sinkName) => {
  try {
    let retries = 0;
    do {
      try {
        await sleep(1000);
        logger.info("Waiting for vector to reload");
        const sinkExists = await graphql.getComponentByName(sinkName);
        const sourceExists = await graphql.getComponentByName(sourceName);
        if (sinkExists && sourceExists) {
          logger.info("Vector reloaded");
          return true;
        }
        retries++;
      } catch (ex) {
        retries++;
        logger.error(ex);
      }
    } while (retries < 3);
    return false;
  } catch (ex) {
    logger.error(ex);
    return false;
  }
};
