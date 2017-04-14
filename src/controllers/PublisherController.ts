import { Get, Post, Route, Body, Query, Header, Path, SuccessResponse, Controller, Example } from "tsoa";

import { RetracedEvent } from "../models/event/";
import {EventCreater, CreateEventResult} from "../handlers/createEvent";

@Route("publisher/v1")
export class PublisherController extends Controller {

    private readonly eventCreater: EventCreater;

    constructor(eventCreater: EventCreater) {
        super();
        this.eventCreater = eventCreater;
    }

    @Post("project/{projectId}/event")
    @SuccessResponse("201", "Created")
    @Example<CreateEventResult>({
        id: "abf053dc4a3042459818833276eec717",
        hash: "5b570bff4628b35262fb401d2f6c9bb38d29e212f6e0e8ea93445b4e5a253d50",
    })
    public async createEvent(
        @Header("Authorization") auth: string,
        @Path("projectId") projectId: string,
        @Body() event: RetracedEvent,
    ): Promise<CreateEventResult> {

        const result: any = await this.eventCreater.createEvent(auth, projectId, event);

        this.setStatus(result.status);
        return Promise.resolve(result.body);

    }
}
