import graphql from "../../services/graphql";
import fs from "fs";
import config from "../../config";
import { getSafeFileName, sleep } from "../../services/helper";
import { ConfigManager } from "../../services/configManager";

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
      });
      let retries = 0,
        verified = false;
      do {
        try {
          await sleep(1000);
          console.log("Waiting for vector to reload");
          const sinkExists = await graphql.getComponentByName(sinkName);
          const sourceExists = await graphql.getComponentByName(sourceName);
          if (sinkExists && sourceExists) {
            console.log("Vector reloaded");
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
        sourceName,
        sinkName,
      });
    }
  } catch (ex) {
    console.log(ex);
    res.status(500).json(ex);
  }
};
