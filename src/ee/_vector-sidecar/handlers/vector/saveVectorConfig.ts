import fs from "fs";
import { ConfigManager } from "../../services/configManager";
import { getSinkName, getSourceName, verifyVectorConfig } from "../../services/vector";
import { getVectorConfig, getVectorConfigPath } from "../../services/helper";
import { logger } from "../../../../logger";

export const saveVectorConfig = async (req, res) => {
  try {
    const body = req.body;
    const { config: sink, tenant, name, id } = body;
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
        id,
        configPath: path,
        sourceHttpPort: port,
        sourceName,
        sinkName,
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
    logger.error(ex);
    res.status(500).json(ex);
  }
};
