import fs from "fs";

import config from "../config";
import { ConfigManager } from "./configManager";
import { getSafeFileName, sleep } from "./helper";
import getPgPool from "./pg";
import graphql from "./graphql";

export const getSourceName = (tenant, name) => {
  return `source_webhook_${tenant}_${name}`;
};

export const getSinkName = (tenant, name) => {
  return `sink_${tenant}_${name}`;
};

export const processConfig = async (
  tenant,
  name,
  sink,
  id?: string
): Promise<{
  sourceName: string;
  sinkName: string;
}> => {
  const sourceName = getSourceName(tenant, name);
  const sinkName = getSinkName(tenant, name);
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
    throw new Error("No available port");
  } else {
    const source = {
      [sourceName]: {
        type: "http_server",
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
      id,
    });
    return { sourceName, sinkName };
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
    const { project_id, name, environment_id, group_id, config, id } = sinkRow;
    const tenant = `${project_id}_${environment_id}_${group_id}`;
    const sourceName = getSourceName(tenant, name);
    const configManager = ConfigManager.getInstance();
    if (configManager.configs[sourceName]) {
      console.log(`Source already exists`);
      return;
    } else {
      console.log(`Source does not exist, adding config`);
      const { sourceName, sinkName } = await processConfig(tenant, name, config, id);
      let verified = await verifyVectorConfig(sourceName, sinkName);
      console.log(`Verified: ${verified}`);
      await setSinkAsActive(sink.id);
    }
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
