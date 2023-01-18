import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";

import * as TypeMoq from "typemoq";

import moment from "moment";
import pg from "pg";
import { ElasticsearchIndexRotator } from "../../workers/ElasticsearchIndexRotator";
import { QueryResult } from "pg";

@suite
class ElasticsearchIndexRotatorTest {
  @test public async "worker(moment.Moment)"() {
    const projectId = "kfbr392";
    const environmentId = "abcdef123456";
    const nextDay = moment.utc("2017-05-09");

    const indices = TypeMoq.Mock.ofType<any>();
    const cat = TypeMoq.Mock.ofType<any>();
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const expectedAliases = {};
    expectedAliases[`retraced.${projectId}.${environmentId}.${nextDay.format("YYYYMMDD")}`] = {};
    expectedAliases[`retraced.${projectId}.${environmentId}`] = {};

    const expectedIndex = {
      index: `${nextDay}`,
      body: {
        aliases: expectedAliases,
      },
    };

    indices
      .setup((x) => x.create(TypeMoq.It.is((a: any) => true)))
      .returns((args: any) => {
        expect(args).to.deep.equal(expectedIndex);
        return Promise.resolve(null);
      })
      .verifiable(TypeMoq.Times.once());

    pool
      .setup((x) => x.query("SELECT * FROM environment"))
      .returns(
        (x) => Promise.resolve({ rowCount: 1, rows: [{ id: environmentId, projectId }] }) as Promise<QueryResult>
      )
      .verifiable(TypeMoq.Times.once());

    const rotator = new ElasticsearchIndexRotator(
      indices.object,
      cat.object,
      pool.object,
      async () => {
        /*ignore for now, still need to test this*/
      },
      (date) => `${date}`
    );

    rotator.worker(nextDay);

    pool.verifyAll();
  }
}

export default ElasticsearchIndexRotatorTest;
