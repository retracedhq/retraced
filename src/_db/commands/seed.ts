import "source-map-support/register";
import rp from "request-promise";
import chalk from "chalk";
import _ from "lodash";
import Chance from "chance";
import util from "util";
import jwt from "jsonwebtoken";
import Retraced from "retraced";
import ProgressBar from "progress";

const adminHmacSecret = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const chance = new Chance();
const actions = _.map(_.range(10), () => {
  return `${chance.syllable()}.${chance.word()}`;
});

const groups = _.map(_.range(2), () => {
  const actors = _.map(_.range(5), () => {
    return {
      id: chance.guid(),
      name: chance.name(),
    };
  });

  const words = [chance.word(), chance.word()];
  return {
    id: `${words[0]}_${words[1]}`,
    name: `${chance.capitalize(words[0])} ${chance.capitalize(words[1])}`,
    actors,
  };
});

exports.command = "seed";
exports.desc = "Seed the databases with some sample data";
exports.builder = {
  eventcount: {
    alias: "c",
    default: 300,
  },
  apiEndpoint: {
    alias: "e",
    default: "http://api:3000",
  },
  userId: {
    alias: "u",
    demand: true,
  },
  projectId: {
    alias: "p",
    demand: true,
  },
  bulk: {
    alias: "b",
    description: "Whether or not to submit events in bulk",
    demand: true,
    default: false,
  },
  groupId: {
    alias: "g",
    description: "Use specific group id for new events",
  },
  envId: {
    description: "Use specific api token associated with this env id for new events",
  },
};

exports.handler = async (argv) => {

  const r = rp.defaults({
    forever: true,
    pool: { maxSockets: 1 },
  });

  const claims = {
    userId: argv.userId,
  };
  const jwtToken = jwt.sign(claims, adminHmacSecret);

  const resp: any = await getProject(r, argv.apiEndpoint, jwtToken, argv.projectId);
  const project = resp.project;

  let apiToken = project.tokens[1];

  if (argv.envId) {
    const maybe = _.find(project.tokens, (t: any) => t.environment_id === argv.envId);
    if (maybe) {
      apiToken = maybe;
    }
  }
  console.log(util.inspect(apiToken, false, 100, true));

  if (argv.groupId) {
    console.log(`group id: ${argv.groupId}`);
  } else {
    console.log(util.inspect(groups, false, 100, true));
  }

  await createEvents(r, argv.apiEndpoint, argv.projectId, argv.eventcount, apiToken, argv.bulk, argv.groupId);
  console.log(chalk.green("Done!"));
};

function getProject(r, endpoint, jwtToken, projectId) {
  return new Promise((resolve, reject) => {
    const options = {
      method: "GET",
      uri: `${endpoint}/admin/v1/project/${projectId}`,
      headers: {
        "User-Agent": "Retraced-Dev/1.0.0",
        "Authorization": jwtToken,
      },
    };
    r(options)
      .then((resp) => {
        resolve(JSON.parse(resp));
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function createEvents(r, endpoint, projectId, count, apiToken, bulk, groupId) {
  const client = new Retraced.Client({
    endpoint,
    apiKey: apiToken.token,
    projectId,
  });
  return new Promise((resolve, reject) => {

    const events = generateEvents(count, groupId);

    const pbar = new ProgressBar("[:bar] :percent :etas", {
      incomplete: " ",
      width: 40,
      total: events.length,
    });

    if (bulk) {
      Promise.all(_.map(_.chunk(events, 10), (someEvents) => {
        return client.reportEvents(someEvents).then(() => pbar.tick(someEvents.length));
      }))
        .then(resolve)
        .catch(reject);
    } else {
      Promise.all(_.map(events, (e) => {
        return client.reportEvent(e).then(() => pbar.tick(1));
      }))
        .then(() => pbar.terminate())
        .then(() => resolve())
        .catch(reject);
    }
  });
}

function generateEvents(count, groupId) {
  const result: any[] = [];

  const crud = ["c", "r", "u", "d"];

  for (let i = 0; i < count; i++) {
    let group;
    if (groupId) {
      group = {
        id: groupId,
        name: "lmao rn tbqh",
      };
    } else {
      group = groups[chance.integer({ min: 0, max: groups.length - 1 })];
    }

    let actor;
    if (groupId) {
      actor = {
        id: chance.guid(),
        name: chance.name(),
      };
    } else {
      actor = group.actors[chance.integer({ min: 0, max: group.actors.length - 1 })];
    }

    let target: any;
    if (i % 2 === 0) {
      target = {
        id: chance.guid(),
        name: chance.word(),
      };
      target.href = `https://doot.doot.com/targets/${target.id}`;
    }

    const message: Retraced.Event = {
      action: actions[chance.integer({ min: 0, max: actions.length - 1 })],
      group: {
        id: group.id,
        name: group.name,
      },
      description: chance.paragraph({ sentences: 1 }),
      sourceIp: chance.ip(),
      actor,
      target,
      crud: crud[chance.integer({ min: 0, max: 3 })],
    };

    if (i % 2 === 0) {
      const d = chance.date();
      const now = new Date();
      d.setFullYear(now.getFullYear());
      d.setMonth(now.getMonth());
      message.created = d; // to test conversion on server side
    }
    if (_.isEmpty(actor)) {
      message.isAnonymous = true;
    }

    result.push(message);
  }

  return result;
}
