import "source-map-support/register";
import { suite, test } from "mocha-typescript";
import { expect } from "chai";

import {
  scope,
} from "../../persistence/elasticsearch";

@suite class ElasticsearchTest {

  @test public "scope(projectId=p1, environemntId=e1, groupId=g1, targetId=t1)"() {
    const [index, filters] = scope({
      projectId: "p1",
      environmentId: "e1",
      groupId: "g1",
      targetId: "t1",
    });
    expect(index).to.equal("retraced.p1.e1.current");
    expect(filters).to.have.length(2);
    expect(filters[0]).to.deep.equal({
      bool: {
        should: [
          { match: {"group.id": { query: "g1", operator: "and" }}},
          { match: {team_id: { query: "g1", operator: "and" }}},
        ],
      },
    });
    expect(filters[1]).to.deep.equal({
      match: { "target.id": { query: "t1", operator: "and" } },
    });
  }

  @test public "scope(projectId=p1, environmentId=e1)"() {
    const [index, filters] = scope({
      projectId: "p1",
      environmentId: "e1",
    });

    expect(index).to.equal("retraced.p1.e1.current");
    expect(filters).to.deep.equal([]);
  }
}
