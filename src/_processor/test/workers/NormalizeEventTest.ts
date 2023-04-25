/* eslint-disable @typescript-eslint/no-unused-expressions */
import { params, suite, test } from "@testdeck/mocha";
import sinon from "sinon";
import normalizeEvent from "../../workers/normalizeEvent";
import { Pool } from "pg";
import { NSQClient } from "../../persistence/nsq";
import { expect } from "chai";

const LOCALHOST_IP = "127.0.0.1";
const RECEIVED = new Date().getTime();

@suite
class NormalizeEventTest {
  queryStub: sinon.SinonStub<any[], any>;
  releaseStub: sinon.SinonStub<any[], any>;
  poolMock: sinon.SinonStub<any[], any>;
  before() {
    this.queryStub = sinon.stub();
    this.releaseStub = sinon.stub();
    this.poolMock = sinon
      .mock(Pool.prototype)
      .expects("connect")
      .callsFake(() => Promise.resolve({ query: this.queryStub, release: this.releaseStub }));
    sinon.stub(NSQClient.prototype, "produce").callsFake(() => Promise.resolve());
  }

  after() {
    sinon.restore();
  }
  @test
  @params(
    {
      originalEvent: `{"action":"some.record.created","crud":"c","group":{"id":"dev"},"created":"2023-01-14T15:48:44.573Z","actor":{"id":"sanju@boxyhq.com","name":"sanjusamson","href":"https://rr.com","fields":{"coolness":"100/100"}},"target":{"id":"101","name":"tasks","type":"tasks","href":"https://boxyhq.com","fields":{"coolness":"5/5"}},"source_ip":"${LOCALHOST_IP}","description":"Some record got created","is_failure":false,"is_anonymous":false,"component":"crm","version":"v0.0.1","external_id":"EXTERNAL_ID_1","metadata":{"sorted":"false","sampled":"true"},"fields":{"country":"India"}}`,
      normalizedEvent: `{"action":"some.record.created","component":"crm","created":1673711324573,"crud":"c","description":"Some record got created","is_anonymous":false,"is_failure":false,"source_ip":"${LOCALHOST_IP}","version":"v0.0.1","id":"925099768bbc42d6adaa9a13d7ac7d6b","received":${RECEIVED},"canonical_time":1673711324573,"fields":{"country":"India"},"group":{"project_id":"dev","environment_id":"dev","name":null,"event_count":1,"created_at":1682078809046,"last_active":1682078809046,"id":"dev"},"actor":{"id":"78b370701169423b8a733bfae504ad62","environment_id":"dev","event_count":1,"foreign_id":"sanju@boxyhq.com","name":"sanjusamson","project_id":"dev","url":"https://rr.com","fields":{"coolness":"100/100"},"created":1682078809050,"first_active":1682078809050,"last_active":1682078809050},"target":{"id":"6415d3ef8bb844e4994f0932fa07639e","environment_id":"dev","event_count":1,"foreign_id":"101","name":"tasks","project_id":"dev","url":"https://boxyhq.com","type":"tasks","fields":{"coolness":"5/5"},"created":1682078809053,"first_active":1682078809053,"last_active":1682078809053},"external_id":"EXTERNAL_ID_1","metadata":{"sorted":"false","sampled":"true"}}`,
      group: {
        project_id: "dev",
        environment_id: "dev",
        name: null,
        event_count: 1,
        created_at: 1682078809046,
        last_active: 1682078809046,
        group_id: "dev",
      },
      target: {
        id: "6415d3ef8bb844e4994f0932fa07639e",
        environment_id: "dev",
        event_count: 1,
        foreign_id: "101",
        name: "tasks",
        project_id: "dev",
        url: "https://boxyhq.com",
        type: "tasks",
        fields: { coolness: "5/5" },
        created: 1682078809053,
        first_active: 1682078809053,
        last_active: 1682078809053,
      },
      actor: {
        id: "78b370701169423b8a733bfae504ad62",
        environment_id: "dev",
        event_count: 1,
        foreign_id: "sanju@boxyhq.com",
        name: "sanjusamson",
        project_id: "dev",
        url: "https://rr.com",
        fields: { coolness: "100/100" },
        created: 1682078809050,
        first_active: 1682078809050,
        last_active: 1682078809050,
      },
      action: {
        id: "7c9e3abe9ad442c2b9be60d9e3c52b87",
        created: "2023-04-21 12:06:49.054",
        environment_id: "dev",
        event_count: "1",
        first_active: "2023-04-21 12:06:49.054",
        action: "some.record.created",
        last_active: "2023-04-21 12:10:00.026",
        project_id: "dev",
        display_template: null,
      },
      compressedEvent: '{"created":"2023-01-14T15:48:44.573Z"}',
    },
    "Should populate normalized_event as expected, clear out original_event and create compressed_event"
  )
  public async normalizeEvent({
    originalEvent,
    group,
    target,
    actor,
    action,
    normalizedEvent,
    compressedEvent,
  }) {
    const rows = [
      {
        id: "100",
        original_event: originalEvent,
        normalized_event: "",
        saved_to_dynamo: false,
        saved_to_postgres: false,
        saved_to_elasticsearch: false,
        saved_to_scylla: false,
        project_id: "dev",
        environment_id: "dev",
        new_event_id: "925099768bbc42d6adaa9a13d7ac7d6b",
        received: RECEIVED,
        compressed_event: "",
      },
    ];

    const fields =
      "id, original_event, normalized_event, saved_to_dynamo, saved_to_postgres, saved_to_elasticsearch, project_id, environment_id, new_event_id, extract(epoch from received) * 1000 as received";
    const ingestionTaskQuery = `select ${fields} from ingest_task where id = $1`;
    const normalizeQuery =
      "update ingest_task set original_event = '', normalized_event = $1, compressed_event = $2 where id = $3";

    this.queryStub
      .onCall(0)
      .resolves({
        command: "",
        rowCount: 10,
        oid: 12345,
        rows: rows as any[],
      })
      .onCall(2)
      .resolves({
        command: "",
        rowCount: 10,
        oid: 12345,
        rows: [group],
      })
      .onCall(4)
      .resolves({
        command: "",
        rowCount: 10,
        oid: 12345,
        rows: [actor],
      })
      .onCall(6)
      .resolves({
        command: "",
        rowCount: 10,
        oid: 12345,
        rows: [target],
      })
      .onCall(8)
      .resolves({
        command: "",
        rowCount: 10,
        oid: 12345,
        rows: [action],
      })
      .onCall(9)
      .resolves({
        command: "",
        rowCount: 10,
        oid: 12345,
        rows: [],
      });

    await normalizeEvent({
      body: JSON.stringify({
        taskId: "100",
      }),
    });
    expect(
      this.queryStub.getCall(0).calledWithMatch(ingestionTaskQuery, ["100"]),
      "Failed to query ingest_task table correctly"
    ).to.be.true;
    expect(
      this.queryStub
        .getCall(10)
        .calledWithMatch(normalizeQuery, [JSON.parse(normalizedEvent), JSON.parse(compressedEvent), "100"]),
      "updation of ingest_task with normalizedEvent, compressedEvent failed"
    ).to.be.true;
    expect(this.releaseStub.calledOnce, "pg client to be released after use").to.be.true;
  }
}

export default NormalizeEventTest;
