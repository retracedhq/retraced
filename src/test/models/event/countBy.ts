import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";
import * as TypeMoq from "typemoq";

import { countBy } from "../../../models/event/countBy";
import { Client, ApiResponse } from "@opensearch-project/opensearch";

@suite
class EventsCountByTest {
  @test public async "events.countBy()"() {
    const es = TypeMoq.Mock.ofType<Client>();
    const esResponse = {
      body: {
        aggregations: {
          groupedBy: {
            buckets: [
              { key: "user.login", doc_count: 100 },
              { key: "user.logout", doc_count: 95 },
            ],
          },
        },
      },
    } as ApiResponse<any>;

    es.setup((x) => x.search(TypeMoq.It.isAny())).returns((params): any => {
      expect(params.body.query.bool.filter).to.deep.include.members([
        {
          range: { canonical_time: { gte: 1490000000000, lte: 1500000000000 } },
        },
        {
          bool: {
            should: [{ match: { crud: "c" } }, { match: { crud: "u" } }, { match: { crud: "d" } }],
          },
        },
      ]);
      return Promise.resolve(esResponse);
    });

    const counts = await countBy(es.object, {
      groupBy: "action",
      scope: {
        projectId: "p1",
        environmentId: "e1",
      },
      startTime: 1490000000000,
      endTime: 1500000000000,
      crud: ["c", "u", "d"],
    });

    expect(counts).to.deep.equal([
      { value: "user.login", count: 100 },
      { value: "user.logout", count: 95 },
    ]);
  }
}

export default EventsCountByTest;
