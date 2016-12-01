import "source-map-support/register";
import * as fs from "fs";

let config;

export default function getConfig() {
  if (!config) {
    config = JSON.parse(fs.readFileSync("./config/config.json", "utf8"));
  }
  return config;
}
