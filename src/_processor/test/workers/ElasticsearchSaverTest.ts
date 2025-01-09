/* eslint-disable @typescript-eslint/no-unused-expressions */
import { suite, test } from "@testdeck/mocha";
import * as TypeMoq from "typemoq";
import sinon from "sinon";

import moment from "moment";
import { Clock } from "../../common";
import { ElasticsearchSaver } from "../../workers/saveEventToElasticsearch";
import { Client } from "@opensearch-project/opensearch";
import * as instrument from "../../../metrics/opentelemetry/instrumentation";
import { ApiResponse, TransportRequestPromise } from "@opensearch-project/opensearch/lib/Transport.js";
import assert from "assert";

@suite
class ElasticsearchSaverTest {
  @test public async "ElasticSearchSaver#saveEventToElasticsearch()"() {
    const es = TypeMoq.Mock.ofType(Client, TypeMoq.MockBehavior.Loose, true, {
      nodes: ["http://localhost:9200"],
    });
    const recordOtelHistogramStub = sinon.stub(instrument, "recordOtelHistogram");
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

    // es.setup((x: any) => x.index.then).returns(() => undefined);

    es.setup((x) =>
      x.index(
        TypeMoq.It.isValue({
          index: "retraced.proj01.env01.current",
          type: "_doc",
          body: expectedIndexed,
          id: expectedIndexed.canonical_time.toString() + "-" + expectedIndexed.id,
        })
      )
    )
      .returns(() => Promise.resolve({ body: {} }) as TransportRequestPromise<ApiResponse>)
      .verifiable(TypeMoq.Times.once());

    clock
      .setup((x) => x())
      .returns(() => moment(500))
      .verifiable(TypeMoq.Times.once());

    const saver = new ElasticsearchSaver(es.object, clock.object);
    await saver.saveEventToElasticsearch({ body: Buffer.from(jobBody) });
    assert.strictEqual(
      recordOtelHistogramStub.calledWithExactly("workers.saveEventToElasticSearch.latencyCreated", 400),
      true,
      "It should have tracked the time to make an event searchable from the point of reception"
    );
    assert.strictEqual(
      recordOtelHistogramStub.calledWithExactly("workers.saveEventToElasticSearch.latencyReceived", 300),
      true,
      "It should have tracked the time to make an event searchable from the point of reception"
    );
    es.verifyAll();
    clock.verifyAll();
  }
}

export default ElasticsearchSaverTest;
