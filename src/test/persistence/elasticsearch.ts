import "source-map-support/register";
import { suite, test } from "mocha-typescript";
import { expect } from "chai";

import {
  scope,
} from "../../persistence/elasticsearch";

@suite class ElasticsearchTest {

  @test public "scope(groupId=g1, targetIds=[t1,t2])"() {
    const [index, filters] = scope({
      projectId: "p1",
      environmentId: "e1",
      groupId: "g1",
      targetIds: ["t1", "t2"],
    });
    expect(index).to.equal("retraced.p1.e1");
    expect(filters).to.have.length(2);
    expect(filters[0]).to.deep.equal({
      bool: {
        should: [
          { term: {"group.id": "g1"}},
          { term: {team_id: "g1"}},
        ],
      },
    });
    expect(filters[1]).to.deep.equal({
      bool: {
        should: [
          { term: {"target.id": "t1"}},
          { term: {"target.id": "t2"}},
        ],
      },
    });
  }

  @test public "scope(groupId=g1, targetIds=[])"() {
    const [index, filters] = scope({
      projectId: "p1",
      environmentId: "e1",
      groupId: "",
      targetIds: [],
    });

    expect(index).to.equal("retraced.p1.e1");
    expect(filters).to.deep.equal([{
      bool: {
        should: [],
      },
    }]);
  }
}
