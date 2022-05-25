import { bootstrapProject } from "../headless";
import util from "util";
import getPgPool from "../persistence/pg";

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
    let count = 0, sql;
    if (pool) {
        do {
            try {
                sql = "SELECT * FROM " + tableName[count] + " LIMIT 1";
                await pool.query(sql);
                console.log(`Found table ${tableName[count]}`);
                count++;
            } catch (ex) {
                console.log(`Table ${tableName[count]} not found`);
            }
        } while (tableName.length > count);
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
    await checkTableAvailability(tables);

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
