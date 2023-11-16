import fs from "fs";
import { VectorConfig } from "../types";
import config from "../config";
import { getVectorConfig } from "./helper";

export type Config = {
  configPath: string;
  sourceName: string;
  sinkName: string;
  sourceHttpPort: number;
  id?: string;
};

type ConfigMap = {
  [key: string]: Config;
};

type ComponenetReceivedEventsStats = {
  [key: string]: number;
};

type ComponenetSentEventsStats = {
  [key: string]: number;
};

type SinkRetryDiff = {
  [key: string]: number;
};

// a singleton class that manages the configuration for the vector instance
export class ConfigManager {
  portBanList = new Set<number>();
  private static instance: ConfigManager;
  initConfig: { configPath: string; sourceName: string; sourceHttpPort: number };
  configs: ConfigMap = {};
  receivedEvents: ComponenetReceivedEventsStats = {};
  sentEvents: ComponenetSentEventsStats = {};
  sinkRetryDiff: SinkRetryDiff = {};

  static getInstance() {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  static init() {
    ConfigManager.getInstance();
  }

  updateReceivedEventsStats(componentId: string, receivedEventsTotal: number) {
    this.receivedEvents[componentId] = receivedEventsTotal;
  }

  updateSentEventsStats(componentId: string, sentEventsTotal: number) {
    this.sentEvents[componentId] = sentEventsTotal;
  }

  updateSinkRetryDiff(componentId: string, diff: number) {
    this.sinkRetryDiff[componentId] = diff;
  }

  private constructor() {
    this.portBanList.add(config.VECTOR_API_PORT);
    this.portBanList.add(config.PORT);
    try {
      if (config.MODE === "sidecar") {
        this.loadExistingConfigs();
      }
      const content = fs.readFileSync("/etc/vector/config/vector.json", "utf8");
      const json = JSON.parse(content) as VectorConfig;
      const initSourceName = Object.keys(json.sources)[0];
      this.initConfig = {
        configPath: "/etc/vector/config/vector.json",
        sourceHttpPort: json.sources[initSourceName]?.address?.split(":")[1] || 9000,
        sourceName: initSourceName,
      };
      this.portBanList.add(this.initConfig.sourceHttpPort);
    } catch (ex) {
      console.log("Could not read vector config");
    }
  }

  private loadExistingConfigs() {
    try {
      // read all json file from /etc/vector/config
      // and add them to the configs map
      const files = fs.readdirSync("/etc/vector/config");
      for (const file in files) {
        if (!files[file].endsWith(".json") || files[file] === "vector.json") {
          continue;
        }
        const path = `/etc/vector/config/${files[file]}`;
        const content = fs.readFileSync(path, "utf8");
        const json = JSON.parse(content) as VectorConfig;
        const sourceName = Object.keys(json.sources)[0];
        let sourceHttpPort: number | undefined =
          Number(json.sources[sourceName]?.address?.split(":")[1]) || 9000;
        const sinkName = Object.keys(json.sinks)[0];
        if (this.isPortOccupied(sourceHttpPort)) {
          sourceHttpPort = this.findAvailableSourcePort();
          if (!sourceHttpPort) {
            console.log("No available port");
            continue;
          }
          const newConfig = getVectorConfig(sourceName, sourceHttpPort, sinkName, json.sinks[sinkName]);
          fs.writeFileSync(path, JSON.stringify(newConfig));
        }
        const id = files[file].split(".")[0];
        this.addConfig({
          configPath: path,
          sourceHttpPort,
          sourceName,
          sinkName,
          id,
        });
      }
    } catch (ex) {
      console.log(ex);
    }
  }

  addConfig(sinkConfig: {
    configPath: string;
    sourceName: string;
    sinkName: string;
    sourceHttpPort: number;
    id: string;
  }) {
    this.configs[sinkConfig.id] = sinkConfig;
    console.log(
      `Added config for ${sinkConfig.sourceName} with port ${sinkConfig.sourceHttpPort} and path ${sinkConfig.configPath}`
    );
  }

  getConfigBySinkId(sinkId: string) {
    return this.configs[sinkId];
  }

  findAvailableSourcePort() {
    const start = 1;
    const end = 65535;
    const values = Object.values(this.configs);
    const usedPorts = Array.from(values).map((c) => c.sourceHttpPort);
    // find a port that is not in the ban list and not in the usedPorts
    // list and in between start and end
    for (let i = start; i < end; i++) {
      if (!this.portBanList.has(i) && !usedPorts.includes(i)) {
        return i;
      }
    }
  }
  isPortOccupied(port: number) {
    const values = Object.values(this.configs);
    const usedPorts = Array.from(values).map((c) => c.sourceHttpPort);
    return this.portBanList.has(port) || usedPorts.includes(port);
  }
}
