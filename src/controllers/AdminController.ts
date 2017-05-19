import { Delete, Route, Body, Query, Header, Path, SuccessResponse, Controller, Example } from "tsoa";

import deleteTemplate from "../handlers/admin/deleteTemplate";

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
}
