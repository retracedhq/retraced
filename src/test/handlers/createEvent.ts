import { suite, test } from "@testdeck/mocha";
import * as TypeMoq from "typemoq";
import moment from "moment";

import pg from "pg";
import { NSQClient } from "../../persistence/nsq";

import { EventCreater, CreateEventRequest, CreateEventResponse } from "../../handlers/createEvent";
import Authenticator from "../../security/Authenticator";
import { Connection } from "./Connection";
import assert from "assert";

@suite
class EventCreaterTest {
  @test
  public async "EventCreater#createEventsBulk() throws if more than max events are passed"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const conn = TypeMoq.Mock.ofType(pg.Client);
    const nsq = TypeMoq.Mock.ofType(NSQClient);
    const authenticator = TypeMoq.Mock.ofType(Authenticator);
    const fakeHasher = () => "fake-hash";
    const fakeUUID = () => "kfbr392";

    const body: CreateEventRequest[] = [
      {
        action: "largeTazoTea.purchase",
        crud: "c",
        actor: {
          id: "vicki@vickstelmo.music",
        },
      },
      {
        action: "tips.increment",
        crud: "c",
        actor: {
          id: "vicki@vickstelmo.music",
        },
      },
      {
        action: "tips.decrement",
        crud: "c",
        actor: {
          id: "vicki@vickstelmo.music",
        },
      },
    ];

    authenticator
      .setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
      .returns(() =>
        Promise.resolve({
          token: "some-token",
          created: moment(),
          name: "A Token",
          disabled: false,
          projectId: "a-project",
          environmentId: "an-environment",
          writeAccess: true,
          readAccess: true,
        })
      );

    const creater = new EventCreater(
      pool.object,
      nsq.object,
      fakeHasher,
      fakeUUID,
      authenticator.object,
      2,
      1000
    );

    const expected = new Error("A maximum of 2 events may be created at once, received 3");

    try {
      await creater.createEventBulk("token=some-token", "a-project", body);
      throw new Error(`Expected error ${expected} to be thrown`);
    } catch (err) {
      assert.strictEqual(err.status, 400);
      assert.strictEqual(err.err.message.includes(expected.message), true);
    }

    conn.verify((x: pg.Client) => x.query("BEGIN"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("COMMIT"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("ROLLBACK"), TypeMoq.Times.never());
  }

  @test
  public async "EventCreater#createEventsBulk() with many invalid inputs"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const conn = TypeMoq.Mock.ofType(pg.Client);
    const nsq = TypeMoq.Mock.ofType(NSQClient);
    const authenticator = TypeMoq.Mock.ofType(Authenticator);
    const fakeHasher = () => "fake-hash";
    const fakeUUID = () => "kfbr392";

    const body: CreateEventRequest[] = [
      {
        action: "largeTazoTea.purchase",
        crud: "c",
        actor: {
          name: "vicki@vickstelmo.music",
        },
        source_ip: "192.168.0.1",
      },
      {
        action: "tipjar.increment",
        crud: "c",
        group: {
          name: "a group",
        },
        source_ip: "lol",
      },
    ];

    authenticator
      .setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
      .returns(() =>
        Promise.resolve({
          token: "some-token",
          created: moment(),
          name: "A Token",
          disabled: false,
          projectId: "a-project",
          environmentId: "an-environment",
          writeAccess: true,
          readAccess: true,
        })
      );

    pool
      .setup((x) => x.connect())
      .returns(() => Promise.resolve(conn.object) as Promise<any>)
      .verifiable(TypeMoq.Times.once());

    const creater = new EventCreater(
      pool.object,
      nsq.object,
      fakeHasher,
      fakeUUID,
      authenticator.object,
      50,
      1000
    );

    try {
      await creater.createEventBulk("token=some-token", "a-project", body);
      throw new Error(`Expected error to be thrown`);
    } catch (err) {
      assert.strictEqual(err.status, 400);
      assert.deepEqual(
        err.err.message,
        `One or more invalid inputs, no events were logged:
- Invalid event input at index 0:
-- Field 'actor.id' is required if 'actor' is present
- Invalid event input at index 1:
-- Field 'group.id' is required if 'group' is present
-- Event is not marked anonymous, and missing required field 'actor'
-- Unable to parse 'source_ip' field as valid IPV4 or IPV6 address: lol`
      );

      assert.deepEqual(err.invalid, [
        {
          index: 0,
          message: "Invalid event input at index 0:\n-- Field 'actor.id' is required if 'actor' is present",
          violations: [
            {
              field: "actor.id",
              message: "Field 'actor.id' is required if 'actor' is present",
              violation: "missing",
            },
          ],
        },
        {
          index: 1,
          message:
            "Invalid event input at index 1:\n-- Field 'group.id' is required if 'group' is present\n-- Event is not marked anonymous, and missing required field 'actor'\n-- Unable to parse 'source_ip' field as valid IPV4 or IPV6 address: lol",
          violations: [
            {
              field: "group.id",
              message: "Field 'group.id' is required if 'group' is present",
              violation: "missing",
            },
            {
              field: "actor",
              message: "Event is not marked anonymous, and missing required field 'actor'",
              violation: "missing",
            },
            {
              field: "source_ip",
              message: "Unable to parse 'source_ip' field as valid IPV4 or IPV6 address: lol",
              received: "lol",
              violation: "invalid",
            },
          ],
        },
      ]);
    }

    conn.verify((x: pg.Client) => x.query("BEGIN"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("ROLLBACK"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("COMMIT"), TypeMoq.Times.never());
    nsq.verify((x) => x.produce("raw_events", TypeMoq.It.isAny()), TypeMoq.Times.never());
  }

  @test public async "EventCreater#createEvent()"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const conn = TypeMoq.Mock.ofType(Connection);
    const nsq = TypeMoq.Mock.ofType(NSQClient);
    const authenticator = TypeMoq.Mock.ofType(Authenticator);
    const fakeHasher = () => "fake-hash";
    const fakeUUID = () => "kfbr392";

    const body: CreateEventRequest = {
      action: "largeTazoTea.purchase",
      crud: "c",
      actor: {
        id: "vicki@vickstelmo.music",
      },
      source_ip: "192.168.0.1",
    };

    authenticator
      .setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
      .returns(() =>
        Promise.resolve({
          token: "some-token",
          created: moment(),
          name: "A Token",
          disabled: false,
          projectId: "a-project",
          environmentId: "an-environment",
          writeAccess: true,
          readAccess: true,
        })
      );

    conn.setup((x) => x.release()).verifiable(TypeMoq.Times.once());
    conn
      .setup((x) => x.query(EventCreater.insertIntoIngestTask, TypeMoq.It.isAny())) // Still need to validate args
      .verifiable(TypeMoq.Times.once());
    pool
      .setup((x) => x.connect())
      .returns(() => Promise.resolve(conn.object) as Promise<any>)
      .verifiable(TypeMoq.Times.once());

    // set up nsq
    const jobBody = JSON.stringify({ taskId: "kfbr392" });
    nsq.setup((x) => x.produce("raw_events", jobBody)).returns(() => Promise.resolve());

    const creater = new EventCreater(
      pool.object,
      nsq.object,
      fakeHasher,
      fakeUUID,
      authenticator.object,
      50,
      1000
    );

    const created: any = await creater.createEvent("token=some-token", "a-project", body);

    assert.strictEqual(created.id, "kfbr392");
    assert.strictEqual(created.hash, "fake-hash");
  }

  @test public async "EventCreater#createEvent() ipv6"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const conn = TypeMoq.Mock.ofType(Connection);
    const nsq = TypeMoq.Mock.ofType(NSQClient);
    const authenticator = TypeMoq.Mock.ofType(Authenticator);
    const fakeHasher = () => "fake-hash";
    const fakeUUID = () => "kfbr392";

    const body: CreateEventRequest = {
      action: "largeTazoTea.purchase",
      crud: "c",
      actor: {
        id: "vicki@vickstelmo.music",
      },
      source_ip: "2001:0DB8:6037:18d8:68dd:ccdd:43a1:217d",
    };

    authenticator
      .setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
      .returns(() =>
        Promise.resolve({
          token: "some-token",
          created: moment(),
          name: "A Token",
          disabled: false,
          projectId: "a-project",
          environmentId: "an-environment",
          writeAccess: true,
          readAccess: true,
        })
      );

    conn.setup((x) => x.release()).verifiable(TypeMoq.Times.once());
    conn
      .setup((x) => x.query(EventCreater.insertIntoIngestTask, TypeMoq.It.isAny())) // Still need to validate args
      .verifiable(TypeMoq.Times.once());
    pool
      .setup((x) => x.connect())
      .returns(() => Promise.resolve(conn.object) as Promise<any>)
      .verifiable(TypeMoq.Times.once());

    // set up nsq
    const jobBody = JSON.stringify({ taskId: "kfbr392" });
    nsq.setup((x) => x.produce("raw_events", jobBody)).returns(() => Promise.resolve());

    const creater = new EventCreater(
      pool.object,
      nsq.object,
      fakeHasher,
      fakeUUID,
      authenticator.object,
      50,
      1000
    );

    const created: any = await creater.createEvent("token=some-token", "a-project", body);

    assert.strictEqual(created.id, "kfbr392");
    assert.strictEqual(created.hash, "fake-hash");
  }

  @test public async "EventCreater#createEventsBulk()"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const conn = TypeMoq.Mock.ofType(Connection);
    const nsq = TypeMoq.Mock.ofType(NSQClient);
    const authenticator = TypeMoq.Mock.ofType(Authenticator);
    const fakeHasher = () => "fake-hash";
    const fakeUUID = () => "kfbr392";

    const body: CreateEventRequest[] = [
      {
        action: "largeTazoTea.purchase",
        crud: "c",
        actor: {
          id: "vicki@vickstelmo.music",
        },
      },
      {
        action: "tips.increment",
        crud: "c",
        actor: {
          id: "vicki@vickstelmo.music",
        },
      },
      {
        action: "tips.decrement",
        crud: "c",
        actor: {
          id: "vicki@vickstelmo.music",
        },
      },
    ];

    authenticator
      .setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
      .returns(() =>
        Promise.resolve({
          token: "some-token",
          created: moment(),
          name: "A Token",
          disabled: false,
          projectId: "a-project",
          environmentId: "an-environment",
          writeAccess: true,
          readAccess: true,
        })
      );

    pool
      .setup((x) => x.connect())
      .returns(() => Promise.resolve(conn.object) as Promise<any>)
      .verifiable(TypeMoq.Times.once());

    conn.setup((x) => x.release()).verifiable(TypeMoq.Times.once());
    conn.setup((x) => x.query(TypeMoq.It.isAnyString(), TypeMoq.It.isAny())).verifiable(TypeMoq.Times.once());

    // set up nsq
    nsq
      .setup((x) => x.produce("raw_events", TypeMoq.It.isAny()))
      .returns(() => Promise.resolve())
      .verifiable(TypeMoq.Times.exactly(3));

    const creater = new EventCreater(
      pool.object,
      nsq.object,
      fakeHasher,
      fakeUUID,
      authenticator.object,
      50,
      1000
    );

    const created: CreateEventResponse[] = await creater.createEventBulk(
      "token=some-token",
      "a-project",
      body
    );

    assert.strictEqual(created.length, 3);

    assert.strictEqual(created[0].id, "kfbr392");
    assert.strictEqual(created[0].hash, "fake-hash");
    assert.strictEqual(created[1].id, "kfbr392");
    assert.strictEqual(created[1].hash, "fake-hash");
    assert.strictEqual(created[2].id, "kfbr392");
    assert.strictEqual(created[2].hash, "fake-hash");
  }

  @test public async "EventCreater#createEventsBulk() with postgres error"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const conn = TypeMoq.Mock.ofType(Connection);
    const nsq = TypeMoq.Mock.ofType(NSQClient);
    const authenticator = TypeMoq.Mock.ofType(Authenticator);
    const fakeHasher = () => "fake-hash";
    const fakeUUID = () => "kfbr392";

    const body: CreateEventRequest[] = [
      {
        action: "largeTazoTea.purchase",
        crud: "c",
        actor: {
          id: "vicki@vickstelmo.music",
        },
      },
    ];

    authenticator
      .setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
      .returns(() =>
        Promise.resolve({
          token: "some-token",
          created: moment(),
          name: "A Token",
          disabled: false,
          projectId: "a-project",
          environmentId: "an-environment",
          writeAccess: true,
          readAccess: true,
        })
      );

    pool
      .setup((x) => x.connect())
      .returns(() => Promise.resolve(conn.object) as Promise<any>)
      .verifiable(TypeMoq.Times.once());
    // conn.setup((x) => x.query(EventCreater.insertIntoIngestTask, TypeMoq.It.isAny())).returns(() => Promise.resolve({ rowCount: 1 }));
    conn.setup((x) => x.release()).verifiable(TypeMoq.Times.once());
    conn
      .setup((x) => x.query(TypeMoq.It.isAnyString(), TypeMoq.It.isAny()))
      .throws(new Error("Postgres went away :("));

    // set up nsq
    nsq
      .setup((x) => x.produce("raw_events", TypeMoq.It.isAny()))
      .returns(() => Promise.resolve())
      .verifiable(TypeMoq.Times.exactly(1));

    const creater = new EventCreater(
      pool.object,
      nsq.object,
      fakeHasher,
      fakeUUID,
      authenticator.object,
      50,
      1000
    );

    const expected = new Error("Postgres went away :(");

    try {
      await creater.createEventBulk("token=some-token", "a-project", body);
      throw new Error(`Expected error to be thrown: ${expected}`);
    } catch (err) {
      assert.strictEqual(err.message, expected.message);
    }

    // make sure we didn't send any nsq messages if the txn is ROLLBACK'd
    nsq.verify((x) => x.produce("raw_events", TypeMoq.It.isAny()), TypeMoq.Times.never());
  }

  @test public async "EventCreater.persistEvent()"() {
    const projID = "proj1";
    const envID = "env1";
    const newEventID = "event1";
    const received = Date.now();

    const sleep = async (ms) => {
      await new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    };

    const tests = [
      {
        description: "Only the first persister should be called",
        succeeds: true,
        persisters: [
          { delay: 0, takes: 20, called: true, fails: false },
          { delay: 50, takes: 20, called: false, fails: false },
        ],
      },
      {
        description: "The first two persisters should be called",
        succeeds: true,
        persisters: [
          { delay: 0, takes: 50, called: true, fails: false },
          { delay: 20, takes: 50, called: true, fails: false },
          { delay: 40, takes: 50, called: true, fails: false },
        ],
      },
      {
        description: "All persisters should be called",
        succeeds: true,
        persisters: [
          { delay: 0, takes: 40, called: true, fails: false },
          { delay: 10, takes: 30, called: true, fails: false },
          { delay: 20, takes: 20, called: true, fails: false },
        ],
      },
      {
        description: "All persisters called and first two fail",
        succeeds: true,
        persisters: [
          { delay: 0, takes: 5, called: true, fails: true },
          { delay: 10, takes: 30, called: true, fails: true },
          { delay: 20, takes: 20, called: true, fails: false },
        ],
      },
      {
        description: "All persisters failing should fail the method",
        succeeds: false,
        persisters: [
          { delay: 0, takes: 5, called: true, fails: true },
          { delay: 10, takes: 30, called: true, fails: true },
          { delay: 20, takes: 20, called: true, fails: true },
        ],
      },
    ];

    for (const testElement of tests) {
      const creater = new EventCreater(
        TypeMoq.Mock.ofType(pg.Pool).object,
        TypeMoq.Mock.ofType(NSQClient).object,
        () => "fake-hash",
        () => "fake-uuid",
        TypeMoq.Mock.ofType(Authenticator).object,
        50,
        1000
      );
      const calls: boolean[] = [];
      const persisters = testElement.persisters.map((p, i) => {
        calls[i] = false;
        return {
          delayMS: p.delay,
          persist: async () => {
            calls[i] = true;
            await sleep(p.takes);
            if (p.fails) {
              throw new Error("failed write");
            }
          },
        };
      });

      try {
        await creater.persistEvent(
          projID,
          envID,
          newEventID,
          received,
          {
            action: "largeTazoTea.purchase",
            crud: "c",
            actor: {
              id: "vicki@vickstelmo.music",
            },
          },
          persisters
        );
      } catch (err) {
        if (testElement.succeeds) {
          throw err;
        }
      }

      testElement.persisters.forEach((p, i) => {
        if (p.called !== calls[i]) {
          throw new Error(
            `${testElement.description}: persister[${i}] ${
              p.called ? "should" : "should not"
            } have been called`
          );
        }
      });
    }
  }

  @test
  public async "EventCreater#createEvent() with invalid EventFields"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const conn = TypeMoq.Mock.ofType(pg.Client);
    const nsq = TypeMoq.Mock.ofType(NSQClient);
    const authenticator = TypeMoq.Mock.ofType(Authenticator);
    const fakeHasher = () => "fake-hash";
    const fakeUUID = () => "kfbr392";

    const body: any = {
      action: "some.action",
      group: {
        id: "boxyhq",
        name: "BoxyHQ",
      },
      crud: "c",
      created: new Date().toISOString(),
      source_ip: "127.0.0.1",
      actor: {
        id: "retraced@boxyhq.com",
        name: "Retraced",
        fields: {
          meta: "test-actor",
        },
      },
      target: {
        id: "100",
        name: "tasks",
        type: "Tasks",
        fields: {
          meta: "test-target",
        },
      },
      external_id: "3242342",
      fields: {
        data: 2,
      },
    };

    authenticator
      .setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
      .returns(() =>
        Promise.resolve({
          token: "some-token",
          created: moment(),
          name: "A Token",
          disabled: false,
          projectId: "a-project",
          environmentId: "an-environment",
          writeAccess: true,
          readAccess: true,
        })
      );

    pool
      .setup((x) => x.connect())
      .returns(() => Promise.resolve(conn.object) as Promise<any>)
      .verifiable(TypeMoq.Times.once());

    const creater = new EventCreater(
      pool.object,
      nsq.object,
      fakeHasher,
      fakeUUID,
      authenticator.object,
      50,
      1000
    );

    try {
      await creater.createEvent("token=some-token", "a-project", body);
      throw new Error(`Expected error to be thrown`);
    } catch (err) {
      assert.strictEqual(err.status, 400);
      assert.strictEqual(err.err.message, `"fields.data" must be a string`);
    }

    conn.verify((x: pg.Client) => x.query("BEGIN"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("ROLLBACK"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("COMMIT"), TypeMoq.Times.never());
    nsq.verify((x) => x.produce("raw_events", TypeMoq.It.isAny()), TypeMoq.Times.never());
  }

  // test case with action as number
  @test
  public async "EventCreater#createEvent() with invalid Action value"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const conn = TypeMoq.Mock.ofType(pg.Client);
    const nsq = TypeMoq.Mock.ofType(NSQClient);
    const authenticator = TypeMoq.Mock.ofType(Authenticator);
    const fakeHasher = () => "fake-hash";
    const fakeUUID = () => "kfbr392";

    const body: any = {
      action: 1000,
      group: {
        id: "boxyhq",
        name: "BoxyHQ",
      },
      crud: "c",
      created: new Date().toISOString(),
      source_ip: "127.0.0.1",
      actor: {
        id: "retraced@boxyhq.com",
        name: "Retraced",
        fields: {
          meta: "test-actor",
        },
      },
      target: {
        id: "100",
        name: "tasks",
        type: "Tasks",
        fields: {
          meta: "test-target",
        },
      },
      external_id: "3242342",
      fields: {
        data: 2,
      },
    };

    authenticator
      .setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
      .returns(() =>
        Promise.resolve({
          token: "some-token",
          created: moment(),
          name: "A Token",
          disabled: false,
          projectId: "a-project",
          environmentId: "an-environment",
          writeAccess: true,
          readAccess: true,
        })
      );

    pool
      .setup((x) => x.connect())
      .returns(() => Promise.resolve(conn.object) as Promise<any>)
      .verifiable(TypeMoq.Times.once());

    const creater = new EventCreater(
      pool.object,
      nsq.object,
      fakeHasher,
      fakeUUID,
      authenticator.object,
      50,
      1000
    );

    try {
      await creater.createEvent("token=some-token", "a-project", body);
      throw new Error(`Expected error to be thrown`);
    } catch (err) {
      assert.strictEqual(err.status, 400);
      assert.strictEqual(err.err.message, `Missing required field 'action'`);
    }

    conn.verify((x: pg.Client) => x.query("BEGIN"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("ROLLBACK"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("COMMIT"), TypeMoq.Times.never());
    nsq.verify((x) => x.produce("raw_events", TypeMoq.It.isAny()), TypeMoq.Times.never());
  }

  @test
  public async "EventCreater#createEvent() with invalid crud value"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const conn = TypeMoq.Mock.ofType(pg.Client);
    const nsq = TypeMoq.Mock.ofType(NSQClient);
    const authenticator = TypeMoq.Mock.ofType(Authenticator);
    const fakeHasher = () => "fake-hash";
    const fakeUUID = () => "kfbr392";

    const body: any = {
      action: "some.action",
      group: {
        id: "boxyhq",
        name: "BoxyHQ",
      },
      crud: "b",
      created: new Date().toISOString(),
      source_ip: "127.0.0.1",
      actor: {
        id: "retraced@boxyhq.com",
        name: "Retraced",
        fields: {
          meta: "test-actor",
        },
      },
      target: {
        id: "100",
        name: "tasks",
        type: "Tasks",
        fields: {
          meta: "test-target",
        },
      },
      external_id: "3242342",
      fields: {
        data: 2,
      },
    };

    authenticator
      .setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
      .returns(() =>
        Promise.resolve({
          token: "some-token",
          created: moment(),
          name: "A Token",
          disabled: false,
          projectId: "a-project",
          environmentId: "an-environment",
          writeAccess: true,
          readAccess: true,
        })
      );

    pool
      .setup((x) => x.connect())
      .returns(() => Promise.resolve(conn.object) as Promise<any>)
      .verifiable(TypeMoq.Times.once());

    const creater = new EventCreater(
      pool.object,
      nsq.object,
      fakeHasher,
      fakeUUID,
      authenticator.object,
      50,
      1000
    );

    try {
      await creater.createEvent("token=some-token", "a-project", body);
      throw new Error(`Expected error to be thrown`);
    } catch (err) {
      assert.strictEqual(err.status, 400);
      assert.strictEqual(err.err.message, `Invalid value for 'crud' field: b`);
    }

    conn.verify((x: pg.Client) => x.query("BEGIN"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("ROLLBACK"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("COMMIT"), TypeMoq.Times.never());
    nsq.verify((x) => x.produce("raw_events", TypeMoq.It.isAny()), TypeMoq.Times.never());
  }

  @test
  public async "EventCreater#createEvent() with additional fields in group"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const conn = TypeMoq.Mock.ofType(pg.Client);
    const nsq = TypeMoq.Mock.ofType(NSQClient);
    const authenticator = TypeMoq.Mock.ofType(Authenticator);
    const fakeHasher = () => "fake-hash";
    const fakeUUID = () => "kfbr392";

    const body: any = {
      action: "some.action",
      group: {
        id: "boxyhq",
        name: "BoxyHQ",
        fields: {
          meta: "test-group",
        },
      },
      crud: "c",
      created: new Date().toISOString(),
      source_ip: "127.0.0.1",
      actor: {
        id: "retraced@boxyhq.com",
        name: "Retraced",
        fields: {
          meta: "test-actor",
        },
      },
      target: {
        id: "100",
        name: "tasks",
        type: "Tasks",
        fields: {
          meta: "test-target",
        },
      },
      external_id: "3242342",
    };

    authenticator
      .setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
      .returns(() =>
        Promise.resolve({
          token: "some-token",
          created: moment(),
          name: "A Token",
          disabled: false,
          projectId: "a-project",
          environmentId: "an-environment",
          writeAccess: true,
          readAccess: true,
        })
      );

    pool
      .setup((x) => x.connect())
      .returns(() => Promise.resolve(conn.object) as Promise<any>)
      .verifiable(TypeMoq.Times.once());

    const creater = new EventCreater(
      pool.object,
      nsq.object,
      fakeHasher,
      fakeUUID,
      authenticator.object,
      50,
      1000
    );

    try {
      await creater.createEvent("token=some-token", "a-project", body);
      throw new Error(`Expected error to be thrown`);
    } catch (err) {
      assert.strictEqual(err.status, 400);
      assert.strictEqual(err.err.message, `"group.fields" is not allowed`);
    }

    conn.verify((x: pg.Client) => x.query("BEGIN"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("ROLLBACK"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("COMMIT"), TypeMoq.Times.never());
    nsq.verify((x) => x.produce("raw_events", TypeMoq.It.isAny()), TypeMoq.Times.never());
  }

  @test
  public async "EventCreater#createEvent() with additional fields in actor"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const conn = TypeMoq.Mock.ofType(pg.Client);
    const nsq = TypeMoq.Mock.ofType(NSQClient);
    const authenticator = TypeMoq.Mock.ofType(Authenticator);
    const fakeHasher = () => "fake-hash";
    const fakeUUID = () => "kfbr392";

    const body: any = {
      action: "some.action",
      group: {
        id: "boxyhq",
        name: "BoxyHQ",
      },
      crud: "c",
      created: new Date().toISOString(),
      source_ip: "127.0.0.1",
      actor: {
        id: "retraced@boxyhq.com",
        name: "Retraced",
        fields: {
          meta: "test-actor",
        },
        phone: "555-555-5555",
      },
      target: {
        id: "100",
        name: "tasks",
        type: "Tasks",
        fields: {
          meta: "test-target",
        },
      },
      external_id: "3242342",
    };

    authenticator
      .setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
      .returns(() =>
        Promise.resolve({
          token: "some-token",
          created: moment(),
          name: "A Token",
          disabled: false,
          projectId: "a-project",
          environmentId: "an-environment",
          writeAccess: true,
          readAccess: true,
        })
      );

    pool
      .setup((x) => x.connect())
      .returns(() => Promise.resolve(conn.object) as Promise<any>)
      .verifiable(TypeMoq.Times.once());

    const creater = new EventCreater(
      pool.object,
      nsq.object,
      fakeHasher,
      fakeUUID,
      authenticator.object,
      50,
      1000
    );

    try {
      await creater.createEvent("token=some-token", "a-project", body);
      throw new Error(`Expected error to be thrown`);
    } catch (err) {
      assert.strictEqual(err.status, 400);
      assert.strictEqual(err.err.message, `"actor.phone" is not allowed`);
    }

    conn.verify((x: pg.Client) => x.query("BEGIN"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("ROLLBACK"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("COMMIT"), TypeMoq.Times.never());
    nsq.verify((x) => x.produce("raw_events", TypeMoq.It.isAny()), TypeMoq.Times.never());
  }

  @test
  public async "EventCreater#createEvent() with additional fields in target"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const conn = TypeMoq.Mock.ofType(pg.Client);
    const nsq = TypeMoq.Mock.ofType(NSQClient);
    const authenticator = TypeMoq.Mock.ofType(Authenticator);
    const fakeHasher = () => "fake-hash";
    const fakeUUID = () => "kfbr392";

    const body: any = {
      action: "some.action",
      group: {
        id: "boxyhq",
        name: "BoxyHQ",
      },
      crud: "c",
      created: new Date().toISOString(),
      source_ip: "127.0.0.1",
      actor: {
        id: "retraced@boxyhq.com",
        name: "Retraced",
        fields: {
          meta: "test-actor",
        },
      },
      target: {
        id: "100",
        name: "tasks",
        type: "Tasks",
        fields: {
          meta: "test-target",
        },
        meta: "test-target",
      },
      external_id: "3242342",
    };

    authenticator
      .setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
      .returns(() =>
        Promise.resolve({
          token: "some-token",
          created: moment(),
          name: "A Token",
          disabled: false,
          projectId: "a-project",
          environmentId: "an-environment",
          writeAccess: true,
          readAccess: true,
        })
      );

    pool
      .setup((x) => x.connect())
      .returns(() => Promise.resolve(conn.object) as Promise<any>)
      .verifiable(TypeMoq.Times.once());

    const creater = new EventCreater(
      pool.object,
      nsq.object,
      fakeHasher,
      fakeUUID,
      authenticator.object,
      50,
      1000
    );

    try {
      await creater.createEvent("token=some-token", "a-project", body);
      throw new Error(`Expected error to be thrown`);
    } catch (err) {
      assert.strictEqual(err.status, 400);
      assert.strictEqual(err.err.message, `"target.meta" is not allowed`);
    }

    conn.verify((x: pg.Client) => x.query("BEGIN"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("ROLLBACK"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("COMMIT"), TypeMoq.Times.never());
    nsq.verify((x) => x.produce("raw_events", TypeMoq.It.isAny()), TypeMoq.Times.never());
  }

  @test
  public async "EventCreater#createEvent() with invalid external_id"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const conn = TypeMoq.Mock.ofType(pg.Client);
    const nsq = TypeMoq.Mock.ofType(NSQClient);
    const authenticator = TypeMoq.Mock.ofType(Authenticator);
    const fakeHasher = () => "fake-hash";
    const fakeUUID = () => "kfbr392";

    const body: any = {
      action: "some.action",
      group: {
        id: "boxyhq",
        name: "BoxyHQ",
      },
      crud: "c",
      created: new Date().toISOString(),
      source_ip: "127.0.0.1",
      actor: {
        id: "retraced@boxyhq.com",
        name: "Retraced",
        fields: {
          meta: "test-actor",
        },
      },
      target: {
        id: "100",
        name: "tasks",
        type: "Tasks",
        fields: {
          meta: "test-target",
        },
      },
      external_id: 3242342,
      fields: {
        data: "2",
      },
    };

    authenticator
      .setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
      .returns(() =>
        Promise.resolve({
          token: "some-token",
          created: moment(),
          name: "A Token",
          disabled: false,
          projectId: "a-project",
          environmentId: "an-environment",
          writeAccess: true,
          readAccess: true,
        })
      );

    pool
      .setup((x) => x.connect())
      .returns(() => Promise.resolve(conn.object) as Promise<any>)
      .verifiable(TypeMoq.Times.once());

    const creater = new EventCreater(
      pool.object,
      nsq.object,
      fakeHasher,
      fakeUUID,
      authenticator.object,
      50,
      1000
    );

    try {
      await creater.createEvent("token=some-token", "a-project", body);
      throw new Error(`Expected error to be thrown`);
    } catch (err) {
      assert.strictEqual(err.status, 400);
      assert.strictEqual(err.err.message, `"external_id" must be a string`);
    }

    conn.verify((x: pg.Client) => x.query("BEGIN"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("ROLLBACK"), TypeMoq.Times.never());
    conn.verify((x: pg.Client) => x.query("COMMIT"), TypeMoq.Times.never());
    nsq.verify((x) => x.produce("raw_events", TypeMoq.It.isAny()), TypeMoq.Times.never());
  }
}

export default EventCreaterTest;
