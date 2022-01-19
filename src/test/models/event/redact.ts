import { suite, test } from "mocha-typescript";
import { expect } from "chai";

import Event from "../../../models/event/";
import {redactEvents} from "../../../models/event/query";

@suite class RedactTest {
    @test public "redact items by length and content"() {
        const preEnvVar = process.env.REDACT_REGEX;
        process.env.REDACT_REGEX = "^[a-z0-9]{64}$"; // see https://regex101.com/r/feBvam/1 for examples

        const event1: Event = { id: "should match", action: "test", created: 123, actor: {id: "abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz01"}};
        const event2: Event = { id: "too short", action: "test", actor: {id: "abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz"} };
        const event3: Event = { id: "too long", action: "test", actor: {id: "abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123"} };
        const event4: Event = { id: "wrong contents", action: "test", actor: {id: "Abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz01"} };
        const events: Event[] = [event1, event2, event3, event4];
        const expected = `[{"id":"should match","action":"test","created":123,"actor":{"id":"9811e1ddf569b14d62a237a466700c99034c0836d098a02b2bd146265489c068"}},{"id":"too short","action":"test","actor":{"id":"abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz"}},{"id":"too long","action":"test","actor":{"id":"abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123"}},{"id":"wrong contents","action":"test","actor":{"id":"Abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz01"}}]`;
        expect(JSON.stringify(redactEvents(events))).to.equal(expected);

        process.env.REDACT_REGEX = preEnvVar;
    }

}
