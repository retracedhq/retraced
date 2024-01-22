import { suite, test } from "@testdeck/mocha";

import { scope } from "../../persistence/elasticsearch";
import assert from "assert";

@suite
class ElasticsearchTest {
  @test
  public "scope(projectId=p1, environemntId=e1, groupId=g1, targetId=t1)"() {
    const [index, filters] = scope({
      projectId: "p1",
      environmentId: "e1",
      groupId: "g1",
      targetId: "t1",
    });
    assert.strictEqual(index, "retraced.p1.e1.current");
    assert.strictEqual(filters.length, 2);
    assert.deepEqual(filters[0], {
      bool: {
        should: [
          { match: { "group.id": { query: "g1", operator: "and" } } },
          { match: { team_id: { query: "g1", operator: "and" } } },
        ],
      },
    });
    assert.deepEqual(filters[1], {
      match: { "target.id": { query: "t1", operator: "and" } },
    });
  }

  @test public "scope(projectId=p1, environmentId=e1)"() {
    const [index, filters] = scope({
      projectId: "p1",
      environmentId: "e1",
    });

    assert.strictEqual(index, "retraced.p1.e1.current");
    assert.deepEqual(filters, []);
  }
}

export default ElasticsearchTest;
