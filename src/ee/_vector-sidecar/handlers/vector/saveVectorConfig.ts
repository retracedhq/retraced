import fs from "fs";
import config from "../../config";
import { ConfigManager } from "../../services/configManager";
import { getSinkName, getSourceName, getVectorConfig, verifyVectorConfig } from "../../services/vector";

export const saveVectorConfig = async (req, res) => {
  try {
    const body = req.body;
    let { config: sink, tenant, name, id } = body;
    const sourceName = getSourceName(tenant, name);
    const sinkName = getSinkName(tenant, name);
    console.log(`Config for ${tenant} with name ${name}`);
    const path = `${config.configPath}/${id}.json`;
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
        id,
        configPath: path,
        sourceHttpPort: port,
        sourceName,
      });
      const verified = await verifyVectorConfig(sourceName, sinkName);
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
