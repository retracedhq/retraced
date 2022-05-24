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
    let result = false;
    do {
        let pool = getPgPool();
        if (pool) {
            try {
                console.log(`Checking for table ${tableName}`);
                result = await executeQuery(tableName);
                console.log(`Result => ${result}`);
            } catch (ex) {
                result = false;
                console.log(ex);
            }
        }
    } while (!result);
}

async function executeQuery(tableName): Promise<boolean> {
    return new Promise(async (resolve) => {
        let pool = getPgPool();
        try {
            var sql = "SELECT * FROM schemaversion WHERE name=$1 LIMIT 1";
            let result = await pool.query(sql, [tableName]);
            console.log("query executed successfuly");
            let rows = result.rows;
            if(rows.length > 0) {
                resolve(true);
            } else {
                console.log(`Table ${tableName} not found!`);
                resolve(false);
            }
        } catch (ex) {
            console.log(`Table ${tableName} not found!`);
            resolve(false);
        }
    })
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
