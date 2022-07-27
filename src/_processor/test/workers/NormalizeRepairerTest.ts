import { suite, test } from "mocha-typescript";
import { expect } from "chai";

import * as TypeMoq from "typemoq";

import pg from "pg";
import monkit from "monkit";

import { NSQClient } from "../../persistence/nsq";
import NormalizeRepairer from "../../workers/NormalizeRepairer";
import { QueryResult } from "pg";

const isAny = TypeMoq.It.isAny;

@suite class NormalizeRepairerTest {

    @test public async "NormalizeRepairer#repairOldEvents() with no events"() {
        const pool = TypeMoq.Mock.ofType(pg.Pool);
        const nsq = TypeMoq.Mock.ofType(NSQClient);
        const registry = new monkit.Registry();
        const minAgeMs = 10000;
        const maxEvents = 20000;

        pool.setup((x) => x.query(NormalizeRepairer.selectFromIngestTask, isAny()))
            .returns((q, v) => {
                expect(v[0]).to.equal(minAgeMs);
                expect(v[1]).to.equal(maxEvents);
                return Promise.resolve({ command: "", rowCount: 10, oid: 12345, rows: [] as any[]}) as Promise<QueryResult>;
            })
            .verifiable(TypeMoq.Times.once());

        const repairer = new NormalizeRepairer(
            minAgeMs,
            nsq.object,
            pool.object,
            registry,
            maxEvents,
        );

        await repairer.repairOldEvents();

        nsq.verify((x) => x.produce(isAny(), isAny()), TypeMoq.Times.never());
        expect(registry.meter("NormalizeRepairer.repairOldEvents.allClear").count).to.equal(1);
    }

    @test public async "NormalizeRepairer#repairOldEvents()"() {
        const pool = TypeMoq.Mock.ofType(pg.Pool);
        const nsq = TypeMoq.Mock.ofType(NSQClient);
        const registry = new monkit.Registry();
        const minAgeMs = 10000;
        const maxEvents = 20000;

        const rows = [
            { id: "kfbr392", age_ms: 15000 },
            { id: "abcdef123456", age_ms: 20050 },
        ];

        pool.setup((x) => x.query(NormalizeRepairer.selectFromIngestTask, isAny()))
            .returns((q, v) => {
                expect(v[0]).to.equal(minAgeMs);
                expect(v[1]).to.equal(maxEvents);
                return Promise.resolve({ command: "", rowCount: 10, oid: 12345, rows: rows as any[]}) as Promise<QueryResult>;
            })
            .verifiable(TypeMoq.Times.once());

        const repairer = new NormalizeRepairer(
            minAgeMs,
            nsq.object,
            pool.object,
            registry,
            maxEvents,
        );

        await repairer.repairOldEvents();

        nsq.verify((x) => x.produce(
            "raw_events",
            JSON.stringify({ taskId: rows[0].id }),
        ), TypeMoq.Times.once());

        nsq.verify((x) => x.produce(
            "raw_events",
            JSON.stringify({ taskId: rows[1].id }),
        ), TypeMoq.Times.once());

        expect(registry.histogram("NormalizeRepairer.repairOldEvents.age").max).to.equal(20050);
        expect(registry.histogram("NormalizeRepairer.repairOldEvents.age").min).to.equal(15000);
        expect(registry.histogram("NormalizeRepairer.repairOldEvents.age").count).to.equal(2);
    }
}

export default NormalizeRepairerTest;
