import { Get, Post, Put, Delete, Route, Body, Query, Header, Path, SuccessResponse, Controller, Example, Request } from "tsoa";
import * as express from "express";

import { RetracedEvent } from "../models/event/";
import { defaultEventCreater, EventCreater, CreateEventRequest, CreateEventResponse } from "../handlers/createEvent";
import { createViewerDescriptor, ViewerToken } from "../handlers/createViewerDescriptor";
import { createEnterpriseToken, CreateEnterpriseToken, EnterpriseToken } from "../handlers/createEnterpriseToken";
import { deleteEnterpriseToken } from "../handlers/deleteEnterpriseToken";
import { listEnterpriseTokens } from "../handlers/listEnterpriseTokens";
import { updateEnterpriseToken } from "../handlers/updateEnterpriseToken";
import { getEnterpriseToken } from "../handlers/getEnterpriseToken";

const route = (req: express.Request) => `${req.method} ${req.originalUrl}`;

@Route("publisher/v1")
export class PublisherController extends Controller {

    private readonly eventCreater: EventCreater;

    constructor(eventCreater?: EventCreater) {
        super();
        this.eventCreater = eventCreater || defaultEventCreater;
    }

    /**
     * Create an event. Returns the id of the created event, and
     * a cryptographic hash of the received event, as described at
     * https://preview.retraced.io/documentation/architecture/hashing-formula/
     *
     * @param auth      auth header of the form token=...
     * @param projectId the project id
     * @param event     The event body to log
     */
    @Post("project/{projectId}/event")
    @SuccessResponse("201", "Created")
    @Example<CreateEventResponse>({
        id: "abf053dc4a3042459818833276eec717",
        hash: "5b570bff4628b35262fb401d2f6c9bb38d29e212f6e0e8ea93445b4e5a253d50",
    })
    public async createEvent(
        @Header("Authorization") auth: string,
        @Path("projectId") projectId: string,
        @Body() event: CreateEventRequest,
        ): Promise<CreateEventResponse> {

        const result: any = await this.eventCreater.createEvent(auth, projectId, event);

        this.setStatus(result.status);
        return Promise.resolve(result.body);

    }

    /**
     * Create a token for use with the Retraced embedded viewer as described at
     *
     * https://preview.retraced.io/documentation/getting-started/embedded-viewer/
     *
     * **Note**: At least one of `group_id` or `team_id` is required.
     *
     * @param auth      auth header of the form token=...
     * @param projectId the project id
     * @param groupId   The group identifier. Same as `team_id`. If both are passed, `group_id` will be used.
     * @param isAdmin   Whether to display the Enterprise Settings and API Token Management. Set to `true` to show the settings.
     * @param targetId  If passed, only events relating to this target will be returned in a viewer that uses the token created
     * @param teamId    Same as `group_id`. If both are passed, `group_id` will be used. This field is deprecated.
     */
    @Get("project/{projectId}/viewertoken")
    @SuccessResponse("201", "Created")
    @Example<ViewerToken>({
        token: "abf053dc4a3042459818833276eec717",
    })
    public async createViewerDescriptor(
        @Header("Authorization") auth: string,
        @Path("projectId") projectId: string,
        @Query("group_id") groupId?: string,
        @Query("is_admin") isAdmin?: string,
        @Query("target_id") targetId?: string,
        @Query("team_id") teamId?: string,
        @Query("view_log_action") viewLogAction?: string,
    ): Promise<ViewerToken> {

        const result: any = await createViewerDescriptor(auth, projectId, isAdmin === "true", groupId, teamId, targetId, viewLogAction);

        this.setStatus(result.status);
        return Promise.resolve(result.body);
    }

    /**
     * Create a token for use with Enterprise IT API
     *
     * https://preview.retraced.io/documentation/apis/enterprise-api/
     *
     * @param auth      auth header of the form token=...
     * @param projectId the project id
     * @param groupId   The group identifier. The generated token will be scoped to the specified group.
     * @param token     The details for creating the token
     */
    @Post("project/{projectId}/group/{groupId}/enterprisetoken")
    @SuccessResponse("201", "Created")
    @Example<EnterpriseToken>({
        token: "abf053dc4a3042459818833276eec717",
        display_name: "Default Production Token",
        view_log_action: "audit.log.view",
    })
    public async createEnterpriseToken(
        @Header("Authorization") auth: string,
        @Path("projectId") projectId: string,
        @Path("groupId") groupId: string,
        @Body() token: CreateEnterpriseToken,
        @Request() req: express.Request,
    ): Promise<EnterpriseToken> {

        const result: any = await createEnterpriseToken(
          auth,
          projectId,
          groupId,
          token,
          req.ip,
          route(req),
        );

        this.setStatus(result.status);
        return Promise.resolve(result.body);
    }

    /**
     * List all Enterprise IT API tokens.
     *
     * https://preview.retraced.io/documentation/apis/enterprise-api/
     *
     * @param auth      auth header of the form token=...
     * @param projectId the project id
     * @param groupId   The group identifier.
     */
    @Get("project/{projectId}/group/{groupId}/enterprisetoken")
    @SuccessResponse("200", "OK")
    @Example<EnterpriseToken[]>([{
        token: "abf053dc4a3042459818833276eec717",
        display_name: "Primary Token",
        view_log_action: "audit.log.view",
    }, {
        token: "f053dc4a3042459818833276eec717ab",
        display_name: "Secondary Token",
        view_log_action: "audit.log.view",
    }])
    public async listEnterpriseTokens(
        @Header("Authorization") auth: string,
        @Path("projectId") projectId: string,
        @Path("groupId") groupId: string,
        @Request() req: express.Request,
    ): Promise<EnterpriseToken[]> {
        const result = await listEnterpriseTokens(
          auth,
          projectId,
          groupId,
          req.ip,
          route(req),
        );

        this.setStatus(result.status);
        return Promise.resolve(result.body);
    }

    /**
     * Retrieve an Enterprise IT API token.
     *
     * https://preview.retraced.io/documentation/apis/enterprise-api/
     *
     * @param auth      auth header of the form token=...
     * @param projectId The project id.
     * @param groupId   The group identifier.
     * @param tokenId   The token id.
     */
    @Get("project/{projectId}/group/{groupId}/enterprisetoken/{tokenId}")
    @SuccessResponse("200", "OK")
    @Example<EnterpriseToken>({
        token: "f053dc4a3042459818833276eec717ab",
        display_name: "Production Token",
        view_log_action: "audit.log.view",
    })
    public async getEnterpriseToken(
        @Header("Authorization") auth: string,
        @Path("projectId") projectId: string,
        @Path("groupId") groupId: string,
        @Path("tokenId") tokenId: string,
        @Request() req: express.Request,
    ): Promise<EnterpriseToken> {
        const result = await getEnterpriseToken(
          auth,
          projectId,
          groupId,
          tokenId,
          req.ip,
          route(req),
        );

        this.setStatus(result.status);
        return Promise.resolve(result.body);
    }

    /**
     * Update an Enterprise IT API token
     *
     * https://preview.retraced.io/documentation/apis/enterprise-api/
     *
     * @param auth      auth header of the form token=...
     * @param projectId the project id
     * @param groupId   The group identifier.
     * @param tokenId   The token to update.
     * @param token     The updated token.
     */
    @Put("project/{projectId}/group/{groupId}/enterprisetoken/{tokenId}")
    @SuccessResponse("200", "OK")
    @Example<EnterpriseToken>({
        token: "abf053dc4a3042459818833276eec717",
        display_name: "Updated Token Name",
        view_log_action: "audit.log.view",
    })
    public async updateEnterpriseToken(
        @Header("Authorization") auth: string,
        @Path("projectId") projectId: string,
        @Path("groupId") groupId: string,
        @Path("tokenId") tokenId: string,
        @Body() token: CreateEnterpriseToken,
        @Request() req: express.Request,
    ): Promise<EnterpriseToken> {
      const result = await updateEnterpriseToken(
        auth,
        projectId,
        groupId,
        tokenId,
        token.displayName,
        token.viewLogAction,
        req.ip,
        route(req),
      );

      this.setStatus(result.status);
      return Promise.resolve(result.body);
    }

    /**
     * Delete an Enterprise IT API token
     *
     * https://preview.retraced.io/documentation/apis/enterprise-api/
     *
     * @param auth      auth header of the form token=...
     * @param projectId the project id
     * @param groupId   The group identifier.
     * @param tokenId   The token to delete.
     */
    @Delete("project/{projectId}/group/{groupId}/enterprisetoken/{tokenId}")
    @SuccessResponse("204", "Deleted")
    public async deleteEnterpriseToken(
        @Header("Authorization") auth: string,
        @Path("projectId") projectId: string,
        @Path("groupId") groupId: string,
        @Path("tokenId") tokenId: string,
        @Request() req: express.Request,
    ): Promise<void> {

        const result: any = await deleteEnterpriseToken(
          auth,
          projectId,
          groupId,
          tokenId,
          req.ip,
          route(req),
        );
        this.setStatus(result.status);
    }
}
