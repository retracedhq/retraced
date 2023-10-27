import fs from 'fs';
import { VectorConfig } from '../types';
import config from '../config';

export type Config = {
  configPath: string;
  sourceName: string;
  sourceHttpPort: number;
};

type ConfigMap = {
  [key: string]: Config;
};

// a singleton class that manages the configuration for the vector instance
export class ConfigManager {
  portBanList = new Set<number>();
  private static instance: ConfigManager;
  initConfig: { configPath: string; sourceName: string; sourceHttpPort: number };
  configs: ConfigMap = {};

  static getInstance() {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  static init() {
    ConfigManager.getInstance();
  }

  private constructor() {
    this.portBanList.add(config.vectorAPIPort);
    this.portBanList.add(config.port);
    try {
      const content = fs.readFileSync('/etc/vector/config/vector.json', 'utf8');
      const json = JSON.parse(content) as VectorConfig;
      const initSourceName = Object.keys(json.sources)[0];
      this.initConfig = {
        configPath: '/etc/vector/config/vector.json',
        sourceHttpPort: json.sources[initSourceName]?.address?.split(':')[1] || 9000,
        sourceName: initSourceName,
      };
      this.portBanList.add(this.initConfig.sourceHttpPort);
    } catch (ex) {
      console.log('Could not read vector config');
    }
  }

  addConfig(config: { configPath: string; sourceName: string; sourceHttpPort: number }) {
    this.configs[config.sourceName] = config;
    console.log(
      `Added config for ${config.sourceName} with port ${config.sourceHttpPort} and path ${config.configPath}`
    );
  }

  findAvailableSourcePort() {
    const start = 1,
      end = 65535;
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
}
