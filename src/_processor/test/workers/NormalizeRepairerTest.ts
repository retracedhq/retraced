import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";
import * as TypeMoq from "typemoq";
import pg from "pg";
import { Registry } from "monkit";
import { QueryResult } from "pg";
import { WorkflowClient } from "@temporalio/client";

import NormalizeRepairer from "../../workers/NormalizeRepairer";
import { normalizeEventWorkflow } from "../../temporal/workflows";
import workflowClient from "../../persistence/temporal";

const isAny = TypeMoq.It.isAny;

@suite
class NormalizeRepairerTest {
  @test public async "NormalizeRepairer#repairOldEvents() with no events"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const workflowClient = TypeMoq.Mock.ofType(WorkflowClient);
    const registry = new Registry();
    const minAgeMs = 10000;
    const maxEvents = 20000;

    pool
      .setup((x) => x.query(NormalizeRepairer.selectFromIngestTask, isAny()))
      .returns((q, v) => {
        expect(v[0]).to.equal(minAgeMs);
        expect(v[1]).to.equal(maxEvents);
        return Promise.resolve({
          command: "",
          rowCount: 10,
          oid: 12345,
          rows: [] as any[],
        }) as Promise<QueryResult>;
      })
      .verifiable(TypeMoq.Times.once());

    const repairer = new NormalizeRepairer(minAgeMs, pool.object, registry, maxEvents);

    await repairer.repairOldEvents();

    workflowClient.verify((x) => x.start(isAny(), isAny()), TypeMoq.Times.never());

    expect(registry.meter("NormalizeRepairer.repairOldEvents.allClear").count).to.equal(1);
  }

  @test public async "NormalizeRepairer#repairOldEvents()"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    const workflowClient = TypeMoq.Mock.ofType(WorkflowClient);
    const registry = new Registry();
    const minAgeMs = 10000;
    const maxEvents = 20000;

    const rows = [
      { id: "kfbr392", age_ms: 15000 },
      { id: "abcdef123456", age_ms: 20050 },
    ];

    pool
      .setup((x) => x.query(NormalizeRepairer.selectFromIngestTask, isAny()))
      .returns((q, v) => {
        expect(v[0]).to.equal(minAgeMs);
        expect(v[1]).to.equal(maxEvents);
        return Promise.resolve({
          command: "",
          rowCount: 10,
          oid: 12345,
          rows: rows as any[],
        }) as Promise<QueryResult>;
      })
      .verifiable(TypeMoq.Times.once());

    const repairer = new NormalizeRepairer(minAgeMs, pool.object, registry, maxEvents);

    await repairer.repairOldEvents();

    // workflowClient.verify((x) => x.start(normalizeEventWorkflow, isAny()), TypeMoq.Times.once());

    // nsq.verify((x) => x.produce("raw_events", JSON.stringify({ taskId: rows[0].id })), TypeMoq.Times.once());

    // nsq.verify((x) => x.produce("raw_events", JSON.stringify({ taskId: rows[1].id })), TypeMoq.Times.once());

    expect(registry.histogram("NormalizeRepairer.repairOldEvents.age").max).to.equal(20050);
    expect(registry.histogram("NormalizeRepairer.repairOldEvents.age").min).to.equal(15000);
    expect(registry.histogram("NormalizeRepairer.repairOldEvents.age").count).to.equal(2);
  }
}

export default NormalizeRepairerTest;
