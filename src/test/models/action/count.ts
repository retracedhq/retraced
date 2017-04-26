import "source-map-support/register";
import { suite, test } from "mocha-typescript";
import { expect } from "chai";
import * as TypeMoq from "typemoq";
import * as elasticsearch from "elasticsearch";

import { countActions } from "../../../models/action/counts";

@suite class CountActionsTest {

    @test public async "actions.count()"() {
        const es = TypeMoq.Mock.ofType<elasticsearch.Client>();
        const esResponse = {
            aggregations: {
                action: {
                    buckets: [
                        { key: "user.login", doc_count: 100 },
                        { key: "user.logout", doc_count: 95 },
                    ],
                },
            },
        } as elasticsearch.SearchResponse<any>;

        es
            .setup((x) => x.search(TypeMoq.It.isAny()))
            .returns((params) => {
                expect(params.body.query.bool.filter).to.deep.include.members([
                    { range: { canonical_time: { gte: 1490000000000, lte: 1500000000000 } } },
                    {
                        bool: {
                            should: [
                                { term: { crud: "c" } },
                                { term: { crud: "u" } },
                                { term: { crud: "d" } },
                            ],
                        },
                    },
              ]);
                return Promise.resolve(esResponse);
            });

        const counts = await countActions(es.object, {
          scope: {
            projectId: "p1",
            environmentId: "e1",
          },
          startTime: 1490000000000,
          endTime: 1500000000000,
          crud: ["c", "u", "d"],
        });

        expect(counts).to.deep.equal([
            { action: "user.login", count: 100 },
            { action: "user.logout", count: 95 },
        ]);
    }

}
