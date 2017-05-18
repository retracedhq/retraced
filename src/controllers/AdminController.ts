import {
    Post, Delete, Route, Body, Query, Header, Path, SuccessResponse, Controller, Example,
} from "tsoa";

import deleteTemplate from "../handlers/admin/deleteTemplate";
import deleteEnvironment from "../handlers/admin/deleteEnvironment";
import createDeletionRequest, { CreateDelReqRequestBody } from "../handlers/admin/createDeletionRequest";

@Route("admin/v1")
export class AdminController extends Controller {

    /**
     * Delete a template. An overview of Template usage in Retraced can be found at
     *
     * https://preview.retraced.io/documentation/advanced-retraced/display-templates/
     *
     *
     * @param auth          Base64 ecoded JWT authentication
     * @param projectId     The project id
     * @param templateId    The id of the template to delete
     * @param environmentId The environment
     */
    @Delete("project/{projectId}/templates/{templateId}")
    @SuccessResponse("204", "Deleted")
    public async deleteTemplate(
        @Header("Authorization") auth: string,
        @Path("projectId") projectId: string,
        @Path("templateId") templateId: string,
        @Query("environment_id") environmentId: string,
    ): Promise<void> {
        await deleteTemplate(auth, projectId, templateId, environmentId);
        this.setStatus(204);
    }

    /**
     * Delete an environment and all of its dependents.
     * This is only allowed if
     * 1) the environment lacks an ES index (i.e. no events recorded), or
     * 2) an outstanding "deletion request" has been approved.
     *
     *
     * @param auth          Base64 ecoded JWT authentication
     * @param projectId     The project id
     * @param environmentId The environment to be deleted
     */
    @Delete("project/{projectId}/environment/{environmentId}")
    @SuccessResponse("204", "Deleted")
    public async deleteEnvironment(
        @Header("Authorization") auth: string,
        @Path("projectId") projectId: string,
        @Path("environmentId") environmentId: string,
    ): Promise<void> {
        const result: any = await deleteEnvironment(auth, projectId, environmentId);
        this.setStatus(result.status);
    }

    /**
     * Create a resource deletion request and associated confirmation
     * requirements (as necessary).
     *
     *
     * @param auth          Base64 ecoded JWT authentication
     * @param projectId     The project id
     * @param environmentId The environment
     */
    @Post("project/{projectId}/environment/{environmentId}/deletion_request")
    @SuccessResponse("201", "Created")
    public async createEnvironmentDeletionRequest(
        @Header("Authorization") auth: string,
        @Path("projectId") projectId: string,
        @Path("environmentId") environmentId: string,
        @Body() requestBody: CreateDelReqRequestBody,
    ): Promise<void> {
        const result: any = await createDeletionRequest(
            auth, projectId, environmentId, requestBody,
        );
        this.setStatus(result.status);
    }

}
