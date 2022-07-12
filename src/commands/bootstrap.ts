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

const sleep = async (time) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(undefined);
        }, time);
    });
};

async function checkTableAvailability(tableName) {
    const pool = getPgPool();
    let count = 0;
    let sql;
    if (pool) {
        do {
            try {
                sql = "SELECT * FROM " + tableName[count] + " LIMIT 1";
                await pool.query(sql);
                console.log(`Found table ${tableName[count]}`);
                count++;
            } catch (ex) {
                console.log(`Table ${tableName[count]} not found`);
            } finally {
                await sleep(300);
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

    do {
        try {
            await bootstrapProject({
                projectId,
                apiKey,
                environmentId,
                projectName,
                environmentName,
                tokenName,
                keyVarRef: "apiKey",
                projectVarRef: "projectId",
                envVarRef: "environmentId",
            });
            console.log(`Bootstraped project ${argv.projectId}`);
            process.exit(0);
        } catch (ex) {
            console.log(`Retrying in 300ms`, ex);
        } finally {
            await sleep(300);
        }
    } while (true);
};
