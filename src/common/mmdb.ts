import { spawn } from "child_process";
import { ReaderModel, Reader, City } from "@maxmind/geoip2-node";
import config from "../config";
import fs from "fs";
import { logger } from "../logger";
import chokidar from "chokidar";

let reader: ReaderModel;
const mmdbPath = config.GEOIPUPDATE_DB_DIR + "/GeoLite2-City.mmdb";

export const mmdbExists = () => {
  return fs.existsSync(mmdbPath);
};

export const queryMMDB = (ip: string) => {
  if (mmdbExists()) {
    reader = getMMDBReader();

    const response: City = reader.city(ip);
    return response;
  } else {
    logger.info(`MMDB file not found at ${mmdbPath}`);
    return null;
  }
};

const getMMDBReader = (refresh = false): ReaderModel => {
  if (!reader || refresh) {
    if (refresh) {
      logger.info("Refreshing MMDB reader");
    }
    const dbBuffer = fs.readFileSync(mmdbPath);

    // This reader object should be reused across lookups as creation of it is
    // expensive.
    reader = Reader.openBuffer(dbBuffer);
  }
  return reader;
};

const initialiseFileWatcher = () => {
  if (config.MAXMIND_GEOLITE2_USE_MMDB && config.GEOIPUPDATE_DB_DIR) {
    const watcher = chokidar.watch(mmdbPath);

    // Event: ready - triggered when initial scan is complete
    watcher.on("ready", () => {
      logger.info(`Watching file: ${mmdbPath}`);

      // Check if the file exists initially
      if (watcher.getWatched()[mmdbPath]) {
        logger.info("MMDB file found.");
      } else {
        logger.info("Watcher coutld not find MMDB file. GeoIP update might be in progress");
      }
    });

    // Event: add - triggered when a new file is added to the watched directory
    watcher.on("add", (path) => {
      logger.info(`MMDB file added: ${path}`);
      getMMDBReader(true);
    });

    // Event: change - triggered when the file is modified
    watcher.on("change", (path) => {
      logger.info(`MMDB file updated: ${path}`);
      getMMDBReader(true);
    });

    // Event: unlink - triggered when the file is deleted
    watcher.on("unlink", (path) => {
      logger.info(`MMDB file deleted: ${path}`);
    });

    // Event: error - triggered when an error occurs
    watcher.on("error", (error) => {
      logger.error(`Watcher error: ${error}`);
    });
  }
};

// Watch the MMDB file for changes
initialiseFileWatcher();
