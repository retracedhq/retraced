import { suite, test } from "mocha-typescript";
import { expect } from "chai";

import Event from "../../../models/event/";
import {redactEvents} from "../../../models/event/query";

@suite class RedactTest {

    @test public "redaction test"() {
        const event1: Event = { id: "kfbr392", action: "largeTazoTea.purchase", created: 123, group: {id: "abc"}};
        const event2: Event = { id: "kfbr392", action: "largeTazoTea.purchase" };
        const events: Event[] = [event1, event2];
        const expected = "a60b49fcbbe8569139b97997eaf8fc0b871d2bb88757ef94eae0056fd9326302";
        expect(redactEvents(events)).to.equal(expected);
    }

}
