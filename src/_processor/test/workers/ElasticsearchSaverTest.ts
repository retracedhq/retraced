import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";

import * as TypeMoq from "typemoq";

import moment from "moment";

import { Clock } from "../../common";
import { ElasticsearchSaver } from "../../workers/saveEventToElasticsearch";
import { Client } from "@opensearch-project/opensearch";
import { recordOtelHistogram } from "../../../metrics/opentelemetry/instrumentation";

const isAny = TypeMoq.It.isAny;

@suite
class ElasticsearchSaverTest {
  @test public async "ElasticSearchSaver#saveEventToElasticsearch()"() {
    const es = TypeMoq.Mock.ofType(Client);
    const histogramRecord = TypeMoq.Mock.ofInstance(recordOtelHistogram);
    const clock = TypeMoq.Mock.ofType<Clock>();
    const jobBody = JSON.stringify({
      environmentId: "env01",
      projectId: "proj01",
      event: {
        action: "license.update",
        actor: {
          created: 1491953535148,
          environment_id: "15edfe6c0cc140e1a9d4f412d6d0b8ad",
          event_count: 342,
          first_active: 1491953535148,
          foreign_id: "actor-foreign-id",
          id: "actor-native-id",
          last_active: 1493755834959,
          name: "dexter@replicated.com",
          project_id: "7f355574245742268ef1057fecadee0a",
          url: "actor-url",
          fields: {
            type: "actor",
          },
        },
        canonical_time: 100,
        created: 100,
        crud: "u",
        description:
          'Updated license for "Pollos Hermanos", changed "foo" from "shabazz shabang" to "shabazz shabang shabog"',
        group: {
          created_at: 1491953535128,
          environment_id: "15edfe6c0cc140e1a9d4f412d6d0b8ad",
          event_count: "342",
          id: "602f21a3fbd3f92302133762808b39af",
          last_active: 1493755834942,
          name: "dexcorp",
          project_id: "7f355574245742268ef1057fecadee0a",
        },
        id: "738ef2617df7490ba7e180ccb34a2391",
        is_anonymous: false,
        is_failure: false,
        raw: '{"action":"license.update","group":{"id":"602f21a3fbd3f92302133762808b39af","name":"dexcorp"},"created":"2017-05-02T20:10:34.90124976Z","crud":"u","target":{"id":"428317855d274f3f68f664638a06c62f","name":"Pollos Hermanos","type":"license","url":"","fields":{"assignee":"Pollos Hermanos","channel_name":"Beta","expiration_date":null,"grant_date":"2017-05-02T18:25:10Z"}},"description":"Updated license for \\"Pollos Hermanos\\", changed \\"foo\\" from \\"shabazz shabang\\" to \\"shabazz shabang shabog\\"","source_ip":"172.19.0.1","actor":{"id":"060dbbd5da8c43b57b26179a3bfb7b1a","name":"dexter@replicated.com","type":"user","url":"http://localhost:8011/#/team/member/060dbbd5da8c43b57b26179a3bfb7b1a"},"is_failure":false,"is_anonymous":false,"component":"vendor-api","version":"fake-version-lol"}',
        received: 200,
        source_ip: "172.19.0.1",
        target: {
          created: 1493749870373,
          environment_id: "15edfe6c0cc140e1a9d4f412d6d0b8ad",
          event_count: 14,
          first_active: 1493749870373,
          foreign_id: "target-foreign-id",
          id: "target-native-id",
          last_active: 1493755834967,
          name: "Pollos Hermanos",
          project_id: "7f355574245742268ef1057fecadee0a",
          type: "license",
          url: "target-url",
          fields: {
            type: "target",
          },
        },
      },
    });

    const expectedIndexed = {
      action: "license.update",
      actor: {
        id: "actor-foreign-id",
        name: "dexter@replicated.com",
        url: "actor-url",
        fields: {
          type: "actor",
        },
      },
      canonical_time: 100,
      created: 100,
      crud: "u",
      description:
        'Updated license for "Pollos Hermanos", changed "foo" from "shabazz shabang" to "shabazz shabang shabog"',
      group: {
        id: "602f21a3fbd3f92302133762808b39af",
        name: "dexcorp",
      },
      id: "738ef2617df7490ba7e180ccb34a2391",
      is_anonymous: false,
      is_failure: false,
      raw: '{"action":"license.update","group":{"id":"602f21a3fbd3f92302133762808b39af","name":"dexcorp"},"created":"2017-05-02T20:10:34.90124976Z","crud":"u","target":{"id":"428317855d274f3f68f664638a06c62f","name":"Pollos Hermanos","type":"license","url":"","fields":{"assignee":"Pollos Hermanos","channel_name":"Beta","expiration_date":null,"grant_date":"2017-05-02T18:25:10Z"}},"description":"Updated license for \\"Pollos Hermanos\\", changed \\"foo\\" from \\"shabazz shabang\\" to \\"shabazz shabang shabog\\"","source_ip":"172.19.0.1","actor":{"id":"060dbbd5da8c43b57b26179a3bfb7b1a","name":"dexter@replicated.com","type":"user","url":"http://localhost:8011/#/team/member/060dbbd5da8c43b57b26179a3bfb7b1a"},"is_failure":false,"is_anonymous":false,"component":"vendor-api","version":"fake-version-lol"}',
      received: 200,
      source_ip: "172.19.0.1",
      target: {
        id: "target-foreign-id",
        name: "Pollos Hermanos",
        type: "license",
        url: "target-url",
        fields: {
          type: "target",
        },
      },
    };

    es.setup((x) => x.index(isAny()))
      .returns((opts): any => {
        expect(opts.body).to.deep.equal({
          index: "retraced.proj01.env01.current",
          type: "event",
          body: expectedIndexed,
        });
        return Promise.resolve({});
      })
      .verifiable(TypeMoq.Times.once());

    clock
      .setup((x) => x())
      .returns(() => moment(500))
      .verifiable(TypeMoq.Times.once());

    histogramRecord
      .setup((x) =>
        x(TypeMoq.It.isValue("workers.saveEventToElasticSearch.latencyCreated"), TypeMoq.It.isValue(400))
      )
      .verifiable(TypeMoq.Times.once(), TypeMoq.ExpectedCallType.InSequence);

    histogramRecord
      .setup((x) =>
        x(TypeMoq.It.isValue("workers.saveEventToElasticSearch.latencyReceived"), TypeMoq.It.isValue(300))
      )
      .verifiable(TypeMoq.Times.once(), TypeMoq.ExpectedCallType.InSequence);

    const saver = new ElasticsearchSaver(es.object, clock.object);
    await saver.saveEventToElasticsearch({ body: Buffer.from(jobBody) });

    es.verifyAll();
    clock.verifyAll();
    histogramRecord.verifyAll();
  }
}

export default ElasticsearchSaverTest;
