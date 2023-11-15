import * as Retraced from "./";

async function runTest() {
  const retraced = new Retraced.Client({
    apiKey: "dev",
    projectId: "dev",
    endpoint: "http://localhost:3000/auditlog",
    viewLogAction: "audit.test.view",
  });

  const viewerToken = await retraced.getViewerToken("test", "test", true);

  console.log(viewerToken);

  const id = await retraced.reportEvent({
    action: "test",
    actor: {
      id: "test",
      name: "test",
    },
    target: {
      id: "test",
      name: "test",
    },
    crud: "c",
    group: {
      id: "test",
      name: "test",
    },
  });

  console.log("id=", id);

  const ids = await retraced.reportEvents([
    {
      action: "test",
      actor: {
        id: "test",
        name: "test",
      },
      target: {
        id: "test",
        name: "test",
      },
      crud: "c",
      group: {
        id: "test",
        name: "test",
      },
    },
  ]);

  console.log("ids=", ids);

  const conn = await retraced.query(
    {},
    {
      id: true,
      action: true,
      actor: {
        name: true,
      },
      received: true,
    },
    5
  );

  await conn.init();

  console.log(conn.currentResults);
}

runTest();
