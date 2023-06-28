import { spawn } from "child_process";
import { ReaderModel, Reader, City } from "@maxmind/geoip2-node";
import config from "../config";
import fs from "fs";
import { logger } from "../logger";
import chokidar from "chokidar";

let reader: ReaderModel;

export const mmdbExists = () => {
  return fs.existsSync(config.GEO_MMDB_PATH);
};

export const execGeoipUpdate = async () => {
  return new Promise((resolve, reject) => {
    const command = "/usr/bin/geoipupdate";
    const args = ["-f", "/etc/GeoIP.conf", "-d", "/etc/mmdb"];

    const child = spawn(command, args);

    child.stdout.on("data", (data) => {
      logger.info(`stdout: ${data}`);
    });

    child.stderr.on("data", (data) => {
      logger.info(`stderr: ${data}`);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        logger.info(`GeoIP update process exited with code ${code}`);
        reject(new Error(`GeoIP update process exited with code ${code}`));
      } else {
        logger.info(`GeoIP update done!`);
        resolve(undefined);
      }
    });
  });
};

export const queryMMDB = (ip: string) => {
  if (mmdbExists()) {
    reader = getMMDBReader();

    const response: City = reader.city(ip);
    return response;
  } else {
    logger.info(`MMDB file not found at ${config.GEO_MMDB_PATH}`);
    return null;
  }
};

const getMMDBReader = (refresh = false): ReaderModel => {
  if (!reader || refresh) {
    if (refresh) {
      logger.info("Refreshing MMDB reader");
    }
    const dbBuffer = fs.readFileSync(config.GEO_MMDB_PATH);

    // This reader object should be reused across lookups as creation of it is
    // expensive.
    reader = Reader.openBuffer(dbBuffer);
  }
  return reader;
};

const initialiseFileWatcher = () => {
  if (config.GEO_USE_MMDB && config.GEO_MMDB_PATH) {
    const watcher = chokidar.watch(config.GEO_MMDB_PATH);

    // Event: ready - triggered when initial scan is complete
    watcher.on("ready", () => {
      logger.info(`Watching file: ${config.GEO_MMDB_PATH}`);

      // Check if the file exists initially
      if (watcher.getWatched()[config.GEO_MMDB_PATH]) {
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
