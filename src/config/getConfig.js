import "source-map-support/register";
import * as fs from "fs";

let config;

function getConfig() {
  if (!config) {
    config = JSON.parse(fs.readFileSync("./config/config.json", "utf8"));
  }
  return config;
}

module.exports = getConfig;
