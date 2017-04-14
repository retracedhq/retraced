import { suite, test } from "mocha-typescript";
import { expect } from "chai";
import * as TypeMoq from "typemoq";

import * as pg from "pg";
import * as express from "express";
import { DisqueClient } from "../../persistence/disque";

import { EventCreater } from "../../handlers/createEvent";

@suite class EventCreaterTest {
    @test public async "EventCreater#createEvent()"() {
        const pool = TypeMoq.Mock.ofType(pg.Pool);
        const disque = TypeMoq.Mock.ofType(DisqueClient);
        const request = TypeMoq.Mock.ofType<express.Request>();
        const fakeHasher = (e) => "fake-hash";
        const fakeUUID = () => "kfbr392";

        // set up request
        request
            .setup((r) => r.get("Authorization"))
            .returns(() => "token=some-token")
            .verifiable(TypeMoq.Times.once());

        const params = { projectId: "a-project" };
        request
            .setup((r) => r.params)
            .returns(() => params)
            .verifiable(TypeMoq.Times.once());

        const body = {
            action: "largeTazoTea.purchase",
            crud: "c",
            actor: {
                id: "vicki@vickstelmo.music",
            },
        };
        request
            .setup((r) => r.body)
            .returns(() => body)
            .verifiable(TypeMoq.Times.once());

        // set up postgres pool
        const tokenIdArgMatcher = TypeMoq.It.is((a: any) => a[0] === "some-token");
        const tokenRows = { rowCount: 1, rows: [{ id: "some-token", project_id: "a-project" }] };
        pool.setup((x) => x.query("select * from token where token = $1", tokenIdArgMatcher))
            .returns((args) => Promise.resolve(tokenRows))
            .verifiable(TypeMoq.Times.once());

        pool.setup((x) => x.query(EventCreater.insertIntoIngestTask, TypeMoq.It.isAny())) // Still need to validate args
            .verifiable(TypeMoq.Times.once());

        // set up disque
        const jobBody = JSON.stringify({taskId: "kfbr392"});
        disque
            .setup((x) => x.addjob("normalize_event", jobBody, 2000, TypeMoq.It.isAny()))
            .returns((args) => Promise.resolve("some-disque-job-id"));

        const creater = new EventCreater(
            pool.object,
            disque.object,
            fakeHasher,
            fakeUUID,
        );

        const resp: any = await creater.createEventRaw(request.object);

        expect(resp.status).to.equal(201);
        const responseBody = JSON.parse(resp.body);
        expect(responseBody.id).to.equal("kfbr392");
        expect(responseBody.hash).to.equal("fake-hash");
    }
}
