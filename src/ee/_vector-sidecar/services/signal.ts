import { spawn } from "child_process";
import { logger } from "../../../logger";

export function getVectorProcessId(): Promise<string> {
  return new Promise((resolve, reject) => {
    // run a command ps aux | grep vector
    const command = "ps aux | grep vector";
    const args = [];
    const options = {
      shell: true,
    };
    const child = spawn(command, args, options);
    child.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      const vectorProcess = lines.find((line) => line.includes("vector --config"));
      if (vectorProcess) {
        const vectorProcessId = vectorProcess.split(" ").filter((item) => item)[0];
        resolve(vectorProcessId);
      } else {
        reject();
      }
    });
    child.stderr.on("data", (data) => {
      logger.error(`stderr: ${data}`);
      reject();
    });
  });
}

export async function reloadConfig() {
  return new Promise(async (resolve, reject) => {
    const vectorProcessId = await getVectorProcessId();
    logger.info(`Reloading config for Vector process id: ${vectorProcessId}`);
    if (vectorProcessId) {
      // kill -SIGHUP <pid>
      const command = `kill -SIGHUP ${vectorProcessId}`;
      const args = [];
      const options = {
        shell: true,
      };
      const child = spawn(command, args, options);
      child.stdout.on("data", (data) => {
        resolve(true);
      });
      child.stderr.on("data", (data) => {
        logger.error(`stderr: ${data}`);
        reject(data);
      });
    }
  });
}
