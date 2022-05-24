import { bootstrapProject } from "../headless";
import util from "util";
import getPgPool from "../persistence/pg";
import { forEach } from "lodash";

export const name = "bootstrap";
export const describe =
  "Bootstrap a retraced project with a specified projectId, environmentId, and apiKey";
export const builder = {
  projectId: {
    demand: true,
  },
  environmentId: {
    demand: true,
  },
  apiKey: {
    demand: true,
  },
  projectName: {
    demand: true,
  },
  environmentName: {
    default: "default",
  },
  tokenName: {
    default: "default",
  },
};

async function checkTableAvailability(tableName) {
  let pool = getPgPool();
  if (pool) {
    try {
      var sql = "SELECT * FROM " + tableName + " LIMIT 1";
      await pool.query(sql, async function (err) {
        if (err) {
          console.log("error in checkTableAvailability while executing query");
          await executeQuery(tableName);
        }
        console.log("query executed successfuly");
      });
    } catch (ex) {
      console.log(ex);
    }
  }
}

async function executeQuery(tableName) {
  let pool = getPgPool();
  try {
    var sql = "SELECT * FROM " + tableName + " LIMIT 1";
    await pool.query(sql, async function (err) {
      if (err) {
        console.log("error in executeErrorQuery while executing query");
        await executeQuery(tableName);
      }
      console.log("query executed successfuly");
    });
  } catch (ex) {
    console.log(ex);
  }
}

export const handler = async (argv) => {
  const {
    projectId,
    apiKey,
    environmentId,
    projectName,
    environmentName,
    tokenName,
  } = argv;

  let tables = ["project", "environment", "token"];
  await tables.forEach(checkTableAvailability);

  bootstrapProject({
    projectId,
    apiKey,
    environmentId,
    projectName,
    environmentName,
    tokenName,
    keyVarRef: "apiKey",
    projectVarRef: "projectId",
    envVarRef: "environmentId",
  })
    .then(() => {
      console.log(`bootstrapped project ${argv.projectId}`);
      process.exit(0);
    })
    .catch((err) => {
      console.log(util.inspect(err));
      process.exit(1);
    });
};
