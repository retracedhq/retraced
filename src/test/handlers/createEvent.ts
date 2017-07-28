import { suite, test } from "mocha-typescript";
import { expect } from "chai";
import * as TypeMoq from "typemoq";
import * as moment from "moment";

import * as pg from "pg";
import { NSQClient } from "../../persistence/nsq";

import { EventCreater, CreateEventRequest, CreateEventResponse } from "../../handlers/createEvent";
import Authenticator from "../../security/Authenticator";
import { Connection } from "./Connection";

@suite class EventCreaterTest {
    @test public async "EventCreater#createEventsBulk() throws if more than max events are passed"() {
        const pool = TypeMoq.Mock.ofType(pg.Pool);
        const conn = TypeMoq.Mock.ofType(pg.Client);
        const nsq = TypeMoq.Mock.ofType(NSQClient);
        const authenticator = TypeMoq.Mock.ofType(Authenticator);
        const fakeHasher = (e) => "fake-hash";
        const fakeUUID = () => "kfbr392";

        const body: CreateEventRequest[] = [
            {
                action: "largeTazoTea.purchase",
                crud: "c",
                actor: {
                    id: "vicki@vickstelmo.music",
                },
            },
            {
                action: "tips.increment",
                crud: "c",
                actor: {
                    id: "vicki@vickstelmo.music",
                },
            },
            {
                action: "tips.decrement",
                crud: "c",
                actor: {
                    id: "vicki@vickstelmo.music",
                },
            },
        ];

        authenticator.setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
            .returns(() => Promise.resolve({
                token: "some-token",
                created: moment(),
                name: "A Token",
                disabled: false,
                projectId: "a-project",
                environmentId: "an-environment",
            }));

        const creater = new EventCreater(
            pool.object,
            nsq.object,
            fakeHasher,
            fakeUUID,
            authenticator.object,
            2,
        );

        const expected = new Error("A maximum of 2 events may be created at once, received 3");

        try {
            await creater.createEventBulk("token=some-token", "a-project", body);
            throw new Error(`Expected error ${expected} to be thrown`);
        } catch (err) {
            expect(err.err.message).to.equal(expected.message);
            expect(err.status).to.equal(400);
        }

        conn.verify((x: pg.Client) => x.query("BEGIN"), TypeMoq.Times.never());
        conn.verify((x: pg.Client) => x.query("COMMIT"), TypeMoq.Times.never());
        conn.verify((x: pg.Client) => x.query("ROLLBACK"), TypeMoq.Times.never());
    }

    @test public async "EventCreater#createEventsBulk() with many invalid inputs"() {
        const pool = TypeMoq.Mock.ofType(pg.Pool);
        const conn = TypeMoq.Mock.ofType(pg.Client);
        const nsq = TypeMoq.Mock.ofType(NSQClient);
        const authenticator = TypeMoq.Mock.ofType(Authenticator);
        const fakeHasher = (e) => "fake-hash";
        const fakeUUID = () => "kfbr392";

        const body: CreateEventRequest[] = [
            {
                action: "largeTazoTea.purchase",
                crud: "c",
                actor: {
                    name: "vicki@vickstelmo.music",
                },
                source_ip: "192.168.0.1",
            },
            {
                action: "tipjar.increment",
                crud: "c",
                group: {
                    name: "a group",
                },
                source_ip: "lol",
            },
        ];

        authenticator.setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
            .returns(() => Promise.resolve({
                token: "some-token",
                created: moment(),
                name: "A Token",
                disabled: false,
                projectId: "a-project",
                environmentId: "an-environment",
            }));

        pool.setup((x) => x.connect()).returns(() => Promise.resolve(conn.object)).verifiable(TypeMoq.Times.once());

        const creater = new EventCreater(
            pool.object,
            nsq.object,
            fakeHasher,
            fakeUUID,
            authenticator.object,
            50,
        );

        try {
            await creater.createEventBulk("token=some-token", "a-project", body);
            throw new Error(`Expected error to be thrown`);
        } catch (err) {
            expect(err.status).to.equal(400);
            expect(err.err.message).to.deep.equal(`One or more invalid inputs, no events were logged:
- Invalid event input at index 0:
-- Field 'actor.id' is required if 'actor' is present
- Invalid event input at index 1:
-- Field 'group.id' is required if 'group' is present
-- Event is not marked anonymous, and missing required field 'actor'
-- Unable to parse 'source_ip' field as valid IPV4 address: lol`);

            expect(err.invalid).to.deep.equal([
                {
                    index: 0,
                    message: "Invalid event input at index 0:\n-- Field 'actor.id' is required if 'actor' is present",
                    violations: [
                        {
                            field: "actor.id",
                            message: "Field 'actor.id' is required if 'actor' is present",
                            violation: "missing",
                        },
                    ],
                },
                {
                    index: 1,
                    message: "Invalid event input at index 1:\n-- Field 'group.id' is required if 'group' is present\n-- Event is not marked anonymous, and missing required field 'actor'\n-- Unable to parse 'source_ip' field as valid IPV4 address: lol",
                    violations: [
                        {
                            field: "group.id",
                            message: "Field 'group.id' is required if 'group' is present",
                            violation: "missing",
                        },
                        {
                            field: "actor",
                            message: "Event is not marked anonymous, and missing required field 'actor'",
                            violation: "missing",
                        },
                        {
                            field: "source_ip",
                            message: "Unable to parse 'source_ip' field as valid IPV4 address: lol",
                            received: "lol",
                            violation: "invalid",
                        },
                    ],
                },

            ]);
        }

        conn.verify((x: pg.Client) => x.query("BEGIN"), TypeMoq.Times.never());
        conn.verify((x: pg.Client) => x.query("ROLLBACK"), TypeMoq.Times.never());
        conn.verify((x: pg.Client) => x.query("COMMIT"), TypeMoq.Times.never());
        nsq.verify((x) => x.produce("raw_events", TypeMoq.It.isAny()), TypeMoq.Times.never());
    }
    @test public async "EventCreater#createEvent()"() {
        const pool = TypeMoq.Mock.ofType(pg.Pool);
        const conn = TypeMoq.Mock.ofType(Connection);
        const nsq = TypeMoq.Mock.ofType(NSQClient);
        const authenticator = TypeMoq.Mock.ofType(Authenticator);
        const fakeHasher = (e) => "fake-hash";
        const fakeUUID = () => "kfbr392";

        const body: CreateEventRequest = {
            action: "largeTazoTea.purchase",
            crud: "c",
            actor: {
                id: "vicki@vickstelmo.music",
            },
        };

        authenticator.setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
            .returns(() => Promise.resolve({
                token: "some-token",
                created: moment(),
                name: "A Token",
                disabled: false,
                projectId: "a-project",
                environmentId: "an-environment",
            }));

        conn.setup((x) => x.release()).verifiable(TypeMoq.Times.once());
        conn.setup((x) => x.query(EventCreater.insertIntoIngestTask, TypeMoq.It.isAny())) // Still need to validate args
            .verifiable(TypeMoq.Times.once());
        pool.setup((x) => x.connect()).returns(() => Promise.resolve(conn.object));

        // set up nsq
        const jobBody = JSON.stringify({ taskId: "kfbr392" });
        nsq
            .setup((x) => x.produce("raw_events", jobBody))
            .returns((args) => Promise.resolve({}));

        const creater = new EventCreater(
            pool.object,
            nsq.object,
            fakeHasher,
            fakeUUID,
            authenticator.object,
            50,
        );

        const created: CreateEventResponse = await creater.createEvent("token=some-token", "a-project", body);

        expect(created.id).to.equal("kfbr392");
        expect(created.hash).to.equal("fake-hash");
    }

    @test public async "EventCreater#createEventsBulk()"() {
        const pool = TypeMoq.Mock.ofType(pg.Pool);
        const conn = TypeMoq.Mock.ofType(Connection);
        const nsq = TypeMoq.Mock.ofType(NSQClient);
        const authenticator = TypeMoq.Mock.ofType(Authenticator);
        const fakeHasher = (e) => "fake-hash";
        const fakeUUID = () => "kfbr392";

        const body: CreateEventRequest[] = [
            {
                action: "largeTazoTea.purchase",
                crud: "c",
                actor: {
                    id: "vicki@vickstelmo.music",
                },
            },
            {
                action: "tips.increment",
                crud: "c",
                actor: {
                    id: "vicki@vickstelmo.music",
                },
            },
            {
                action: "tips.decrement",
                crud: "c",
                actor: {
                    id: "vicki@vickstelmo.music",
                },
            },
        ];

        authenticator.setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
            .returns(() => Promise.resolve({
                token: "some-token",
                created: moment(),
                name: "A Token",
                disabled: false,
                projectId: "a-project",
                environmentId: "an-environment",
            }));

        pool.setup((x) => x.connect()).returns(() => Promise.resolve(conn.object)).verifiable(TypeMoq.Times.once());

        conn.setup((x) => x.release()).verifiable(TypeMoq.Times.once());
        conn.setup((x) => x.query(TypeMoq.It.isAnyString(), TypeMoq.It.isAny())).verifiable(TypeMoq.Times.once());

        // set up nsq
        nsq.setup((x) => x.produce("raw_events", TypeMoq.It.isAny()))
            .returns((args) => Promise.resolve({}))
            .verifiable(TypeMoq.Times.exactly(3));

        const creater = new EventCreater(
            pool.object,
            nsq.object,
            fakeHasher,
            fakeUUID,
            authenticator.object,
            50,
        );

        const created: CreateEventResponse[] = await creater.createEventBulk("token=some-token", "a-project", body);

        expect(created.length).to.equal(3);

        expect(created[0].id).to.equal("kfbr392");
        expect(created[0].hash).to.equal("fake-hash");
        expect(created[1].id).to.equal("kfbr392");
        expect(created[1].hash).to.equal("fake-hash");
        expect(created[2].id).to.equal("kfbr392");
        expect(created[2].hash).to.equal("fake-hash");
    }

    @test public async "EventCreater#createEventsBulk() with postgres error"() {
        const pool = TypeMoq.Mock.ofType(pg.Pool);
        const conn = TypeMoq.Mock.ofType(Connection);
        const nsq = TypeMoq.Mock.ofType(NSQClient);
        const authenticator = TypeMoq.Mock.ofType(Authenticator);
        const fakeHasher = (e) => "fake-hash";
        const fakeUUID = () => "kfbr392";

        const body: CreateEventRequest[] = [
            {
                action: "largeTazoTea.purchase",
                crud: "c",
                actor: {
                    id: "vicki@vickstelmo.music",
                },
            },
        ];

        authenticator.setup((x) => x.getApiTokenOr401("token=some-token", "a-project"))
            .returns(() => Promise.resolve({
                token: "some-token",
                created: moment(),
                name: "A Token",
                disabled: false,
                projectId: "a-project",
                environmentId: "an-environment",
            }));

        pool.setup((x) => x.connect()).returns(() => Promise.resolve(conn.object)).verifiable(TypeMoq.Times.once());
        // conn.setup((x) => x.query(EventCreater.insertIntoIngestTask, TypeMoq.It.isAny())).returns(() => Promise.resolve({ rowCount: 1 }));
        conn.setup((x) => x.release()).verifiable(TypeMoq.Times.once());
        conn.setup((x) => x.query(TypeMoq.It.isAnyString(), TypeMoq.It.isAny())).throws(new Error("Postgres went away :("));

        // set up nsq
        nsq.setup((x) => x.produce("raw_events", TypeMoq.It.isAny()))
            .returns((args) => Promise.resolve({}))
            .verifiable(TypeMoq.Times.exactly(1));

        const creater = new EventCreater(
            pool.object,
            nsq.object,
            fakeHasher,
            fakeUUID,
            authenticator.object,
            50,
        );

        const expected = new Error("Postgres went away :(");

        try {
            await creater.createEventBulk("token=some-token", "a-project", body);
            throw new Error(`Expected error to be thrown: ${expected}`);
        } catch (err) {
            expect(err.message).to.equal(expected.message);
        }

        // make sure we didn't send any nsq messages if the txn is ROLLBACK'd
        nsq.verify((x) => x.produce("raw_events", TypeMoq.It.isAny()), TypeMoq.Times.never());
    }
}
