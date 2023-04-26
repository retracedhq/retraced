const axios = require("axios");
const moment = require("moment");

const apiUrl = "http://127.0.0.1:3000/auditlog/publisher/v1/project/dev/event";
const token = "dev";
const group = "boxyhq-2";

async function ingestEvent(data, i) {
  try {
    await axios.post(apiUrl, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `token=${token}`,
      },
    });

    console.log(`Event ${i} sent successfully!`);
  } catch (error) {
    console.error(error.message);
  }
}

async function run() {
  for (let i = 1; i <= 5000; i++) {
    const event = {
      action: "some.record.created",
      group: {
        id: group,
        name: group,
      },
      crud: "c",
      created: moment().format(),
      source_ip: "127.0.0.1",
      actor: {
        id: "kiran@boxyhq.com",
        name: `${i}`,
      },
      target: {
        id: "100",
        name: "tasks",
        type: "Tasks",
      },
    };

    await ingestEvent(event, i);

    //await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

run().catch((error) => console.error(error));
