import fs from "fs";

import config from "../config";
import { ConfigManager } from "./configManager";
import { getVectorConfig, getVectorConfigPath, sleep } from "./helper";
import getPgPool from "../../../_db/persistence/pg";
import graphql from "./graphql";

export const getSourceName = (tenant, name) => {
  return `source_webhook_${tenant}_${name}`;
};

export const getSinkName = (tenant, name) => {
  return `sink_${tenant}_${name}`;
};

export const processConfig = async (
  tenant: string,
  name: string,
  sink: any,
  id: string
): Promise<{
  sourceName: string;
  sinkName: string;
}> => {
  const sourceName = getSourceName(tenant, name);
  const sinkName = getSinkName(tenant, name);
  console.log(`Config for ${tenant} with name ${name}`);
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
    console.log(`Saving to ${path}`);
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
  const { project_id, name, environment_id, group_id, config, id } = sinkRow;
  const tenant = `${project_id}_${environment_id}_${group_id}`;
  const configManager = ConfigManager.getInstance();
  if (configManager.configs[sinkRow.id]) {
    console.log(`Source already exists`);
    return;
  } else {
    console.log(`Source does not exist, adding config`);
    const { sourceName, sinkName } = await processConfig(tenant, name, config, id);
    if (verify) {
      let verified = await verifyVectorConfig(sourceName, sinkName);
      console.log(`Verified: ${verified}`);
    }
    await setSinkAsActive(sinkRow.id);
  }
};

export const handleSinkCreated = async (sink) => {
  const pg = getPgPool();
  console.log(`Sink created: `, sink);
  const res = await pg.query(`SELECT * FROM vectorsink where id=$1`, [sink.id]);
  if (res.rows.length === 0) {
    console.log(`Sink not found`);
  } else {
    console.log(`Sink found`);
    let sinkRow = res.rows[0];
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
  console.log(`Sink updated: `, sink);
  const res = await pg.query(`SELECT * FROM vectorsink where id=$1`, [sink.id]);
  if (res.rows.length === 0) {
    console.log(`Sink not found`);
  } else {
    console.log(`Sink found`);
    let sinkRow = res.rows[0];
    const { project_id, name, environment_id, group_id, config: _config, id } = sinkRow;
    const tenant = `${project_id}_${environment_id}_${group_id}`;
    const sourceName = getSourceName(tenant, name);
    const sinkName = getSinkName(tenant, name);
    const configManager = ConfigManager.getInstance();
    const currentConfig = configManager.getConfigBySinkId(sink.id);
    if (!currentConfig) {
      // create new config
      console.log(`Source does not exist, adding config`);
      const { sourceName, sinkName } = await processConfig(tenant, name, _config, id);
      let verified = await verifyVectorConfig(sourceName, sinkName);
      console.log(`Verified: ${verified}`);
      await setSinkAsActive(sink.id);
    } else {
      // update existing config
      console.log(`Source already exists`);
      const newConfig = getVectorConfig(sourceName, currentConfig.sourceHttpPort, sinkName, _config);
      const path = getVectorConfigPath(sink.id);
      if (path !== currentConfig.configPath) {
        fs.unlinkSync(currentConfig.configPath);
      }
      fs.writeFileSync(path, JSON.stringify(newConfig));
      let verified = await verifyVectorConfig(sourceName, sinkName);
      console.log(`Verified: ${verified}`);
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

export const handleSinkDeleted = async (sink) => {
  const instance = ConfigManager.getInstance();
  const config = Object.values(instance.configs).find((c) => c.id === sink.id);
  let configPath = getVectorConfigPath(sink.id);
  if (config) {
    const { configPath } = config;
    fs.existsSync(configPath) && fs.unlinkSync(configPath);
    delete instance.configs[sink.id];
    console.log(`Config deleted`);
  } else if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
    console.log(`Config deleted`);
  } else {
    console.log(`Config not found`);
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
        console.log("Waiting for vector to reload");
        const sinkExists = await graphql.getComponentByName(sinkName);
        const sourceExists = await graphql.getComponentByName(sourceName);
        if (sinkExists && sourceExists) {
          console.log("Vector reloaded");
          return true;
        }
        retries++;
      } catch (ex) {
        retries++;
        console.log(ex);
      }
    } while (retries < 3);
    return false;
  } catch (ex) {
    console.log(ex);
    return false;
  }
};
