import {
  Get,
  Post,
  Delete,
  Route,
  Body,
  Query,
  Header,
  Path,
  SuccessResponse,
  Controller,
  Put,
  Request,
  Tags,
} from "tsoa";
import express from "express";

import { TemplateSearchResults, TemplateResponse, TemplateValues, responseFromTemplate } from "../models/template";
import createTemplate from "../handlers/admin/createTemplate";
import searchTemplates from "../handlers/admin/searchTemplates";
import deleteTemplate from "../handlers/admin/deleteTemplate";
import { InviteResponse, InviteValues, responseFromInvite } from "../models/invite";
import createInvite from "../handlers/admin/createInvite";
import deleteInvite from "../handlers/admin/deleteInvite";
import listInvites from "../handlers/admin/listInvites";
import { EnvironmentValues, EnvironmentResponse, responseFromEnvironment } from "../models/environment";
import createEnvironment from "../handlers/admin/createEnvironment";
import deleteEnvironment from "../handlers/admin/deleteEnvironment";
import createDeletionRequest, {
  CreateDelReqRequestBody,
  CreateDelReqReport,
} from "../handlers/admin/createDeletionRequest";
import getDeletionRequest, { GetDelReqReport } from "../handlers/admin/getDeletionRequest";
import approveDeletionConfirmation from "../handlers/admin/approveDeletionConfirmation";
import updateApiToken from "../handlers/admin/updateApiToken";
import createApiToken from "../handlers/admin/createApiToken";
import deleteApiToken from "../handlers/admin/deleteApiToken";
import { ApiTokenResponse, ApiTokenValues } from "../models/api_token";
import { audit } from "../headless";
import { AdminToken } from "../models/admin_token/types";
import { AdminTokenStore } from "../models/admin_token/store";
import { checkAdminAccessUnwrapped } from "../security/helpers";
import uniqueId from "../models/uniqueId";

@Route("admin/v1")
@Tags("Admin API")
export class AdminAPI extends Controller {
  private readonly adminTokenStore: AdminTokenStore;

  constructor(adminTokenStore?: AdminTokenStore) {
    super();
    this.adminTokenStore = adminTokenStore || AdminTokenStore.default();
  }

  /**
   * Create an invite. Sends an invitation email to the user.
   *
   * @param auth          Base64 encoded JWT
   * @param projectId     The project id
   * @param body          The invite resource with the invitee's email
   */
  @Post("project/{projectId}/invite")
  @SuccessResponse("201", "Created")
  public async createInvite(
    @Header("Authorization") auth: string,
    @Path("projectId") projectId: string,
    @Body() body: InviteValues,
    @Request() req: express.Request
  ): Promise<InviteResponse> {
    const id = uniqueId();

    await audit(req, "invite.create", "c", {
      target: {
        id,
        name: body.email,
      },
    });

    const invite = await createInvite(auth, projectId, body.email, id);

    this.setStatus(201);

    return responseFromInvite(invite);
  }

  /**
   * Delete an invite.
   *
   * @param auth          Base64 encoded JWT
   * @param projectId     The project id
   * @param inviteId      The environment id
   */
  @Delete(`project/{projectId}/invite/{inviteId}`)
  @SuccessResponse("204", "No Content")
  public async deleteInvite(
    @Header("Authorization") auth: string,
    @Path("projectId") projectId: string,
    @Path("inviteId") inviteId: string,
    @Request() req: express.Request
  ): Promise<void> {
    await audit(req, "invite.delete", "d", {
      target: {
        id: inviteId,
      },
    });

    await deleteInvite(auth, projectId, inviteId);

    this.setStatus(204);
  }

  /**
   * List all invites.
   *
   * @param auth          Base64 encoded JWT
   * @param projectId     The project id
   */
  @Get(`project/{projectId}/invite`)
  @SuccessResponse("200", "OK")
  public async listInvites(
    @Header("Authorization") auth: string,
    @Path("projectId") projectId: string,
    @Request() req: express.Request
  ): Promise<InviteResponse[]> {
    const invites = await listInvites(auth, projectId);

    audit(req, "invite.list", "r");

    return invites.map(responseFromInvite);
  }

  /**
   * Create a template. An overview of Template usage in Retraced can be found at
   *
   * https://boxyhq.com/docs/retraced/advanced/display-templates
   *
   * @param auth          Base64 encoded JWT
   * @param projectId     The project id
   * @param environmentId The environment id
   * @param body          The template resource to create
   */
  @Post("project/{projectId}/templates")
  @SuccessResponse("201", "Created")
  public async createTemplate(
    @Header("Authorization") auth: string,
    @Path("projectId") projectId: string,
    @Query("environment_id") environmentId: string,
    @Body() body: TemplateValues,
    @Request() req: express.Request
  ): Promise<TemplateResponse> {
    // Generate ID here to audit before creating
    const id = uniqueId();

    await audit(req, "template.create", "c", {
      target: {
        id,
        fields: body,
      },
    });

    const template = await createTemplate(auth, projectId, environmentId, Object.assign(body, { id }));

    this.setStatus(201);

    return template
  }

  /**
   * Create a templates. An overview of Template usage in Retraced can be found at
   *
   * https://boxyhq.com/docs/retraced/advanced/display-templates
   *
   * @param auth          Base64 encoded JWT
   * @param projectId     The project id
   * @param environmentId The environment id
   * @param body          The template resource to create
   */
    @Post("project/{projectId}/templates/bulk")
    @SuccessResponse("201", "Created")
    public async createTemplates(
      @Header("Authorization") auth: string,
      @Path("projectId") projectId: string,
      @Query("environment_id") environmentId: string,
      @Body() body: {templates: TemplateValues[]},
      @Request() req: express.Request
    ): Promise<TemplateResponse[]> {
      await audit(req, "template.create.many", "c", {
        target: {
          fields: body,
        },
      });

      const templates: TemplateResponse[] = []
      body.templates.map(async (templateToCreate) => {
        const template = await createTemplate(auth, projectId, environmentId, Object.assign(templateToCreate, { id: uniqueId() }));
        templates.push(template)
      })

      this.setStatus(201);
      return templates;
    }


  /**
   * Search templates. An overview of Template usage in Retraced can be found at
   *
   * https://boxyhq.com/docs/retraced/advanced/display-templates
   *
   * @param auth          Base64 encoded JWT
   * @param projectId     The project id
   * @param environmentId The environmentId
   * @param length        The maximum number of results to return
   * @param offset        How many results to skip
   */
  @Get("project/{projectId}/templates")
  @SuccessResponse("200", "OK")
  public async searchTemplates(
    @Header("Authorization") auth: string,
    @Path("projectId") projectId: string,
    @Query("environment_id") environmentId: string,
    @Request() req: express.Request,
    @Query("length") length?: number,
    @Query("offset") offset?: number
  ): Promise<TemplateSearchResults> {
    const results = await searchTemplates(auth, projectId, environmentId, length || 100, offset || 0);

    await audit(req, "template.search", "r");

    return results;
  }

  /**
   * Delete a template. An overview of Template usage in Retraced can be found at
   *
   * https://boxyhq.com/docs/retraced/advanced/display-templates
   *
   *
   * @param auth          Base64 encoded JWT authentication
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
    @Request() req: express.Request
  ): Promise<void> {
    await audit(req, "template.delete", "d", {
      target: {
        id: templateId,
      },
    });

    await deleteTemplate(auth, projectId, templateId, environmentId);

    this.setStatus(204);
  }

  /**
   * Create a new environment.
   *
   * @param auth          Base64 encoded JWT
   * @param projectId     The project id
   * @param name          The name of the new environment
   */
  @Post("project/{projectId}/environment")
  @SuccessResponse("201", "Created")
  public async createEnvironmentRequest(
    @Header("Authorization") auth: string,
    @Path("projectId") projectId: string,
    @Body() body: EnvironmentValues,
    @Request() req: express.Request
  ): Promise<EnvironmentResponse> {
    const id = uniqueId();

    await audit(req, "environment.create", "c", {
      target: {
        id,
        name: body.name,
        type: "environment",
      },
    });

    const env = await createEnvironment(auth, projectId, body.name, id);

    this.setStatus(201);

    return responseFromEnvironment(env);
  }

  /**
   * Delete an environment and all of its dependents.
   * This is only allowed if
   * 1) the environment is empty (i.e. it lacks any recorded events), or
   * 2) an outstanding "deletion request" has been approved.
   *
   *
   * @param auth          Base64 encoded JWT authentication
   * @param projectId     The project id
   * @param environmentId The environment to be deleted
   */
  @Delete("project/{projectId}/environment/{environmentId}")
  @SuccessResponse("204", "Deleted")
  public async deleteEnvironment(
    @Header("Authorization") auth: string,
    @Path("projectId") projectId: string,
    @Path("environmentId") environmentId: string,
    @Request() req: express.Request
  ): Promise<void> {
    // Pass in audit function to run after all validations, just before deleting
    const preDeleteHook = async () => {
      await audit(req, "environment.delete", "d", {
        target: {
          id: environmentId,
        },
      });
    };

    await deleteEnvironment(auth, projectId, environmentId, preDeleteHook);
    this.setStatus(204);
  }

  /**
   * Create a resource deletion request and associated confirmation
   * requirements (as necessary).
   *
   *
   * @param auth          Base64 encoded JWT authentication
   * @param projectId     The project id
   * @param environmentId The environment
   */
  @Post("project/{projectId}/environment/{environmentId}/deletion_request")
  @SuccessResponse("201", "Created")
  public async createDeletionRequest(
    @Header("Authorization") auth: string,
    @Path("projectId") projectId: string,
    @Path("environmentId") environmentId: string,
    @Body() requestBody: CreateDelReqRequestBody
  ): Promise<CreateDelReqReport> {
    const result = await createDeletionRequest(auth, projectId, environmentId, requestBody);
    this.setStatus(201);
    return result;
  }

  /**
   * Get the current status of an outstanding deletion request.
   *
   *
   * @param auth              Base64 encoded JWT authentication
   * @param projectId         The project id
   * @param environmentId     The environment
   * @param deletionRequestId The id of the deletion request to look up
   */
  @Get("project/{projectId}/environment/{environmentId}/deletion_request/{deletionRequestId}")
  @SuccessResponse("200", "OK")
  public async getDeletionRequest(
    @Header("Authorization") auth: string,
    @Path("projectId") projectId: string,
    @Path("environmentId") environmentId: string,
    @Path("deletionRequestId") deletionRequestId: string
  ): Promise<GetDelReqReport> {
    const result = await getDeletionRequest(auth, projectId, environmentId, deletionRequestId);
    this.setStatus(200);
    return result;
  }

  /**
   * Mark a deletion confirmation as received (i.e. approve it).
   *
   *
   * @param auth              Base64 encoded JWT authentication
   * @param projectId         The project id
   * @param environmentId     The environment
   * @param code              The confirmation code
   */
  @Post("project/{projectId}/environment/{environmentId}/deletion_confirmation/{code}")
  @SuccessResponse("200", "OK")
  public async approveDeletionConfirmation(
    @Header("Authorization") auth: string,
    @Path("projectId") projectId: string,
    @Path("environmentId") environmentId: string,
    @Path("code") code: string
  ): Promise<void> {
    await approveDeletionConfirmation(auth, projectId, environmentId, code);
    this.setStatus(200);
  }

  /**
   * Create a new API token.
   *
   *
   * @param auth
   * @param projectId         The project id
   * @param environmentId     The environment id
   */
  @Post("project/{projectId}/token")
  @SuccessResponse("201", "Created")
  public async createApiToken(
    @Header("Authorization") auth: string,
    @Path("projectId") projectId: string,
    @Query("environment_id") environmentId: string,
    @Body() body: ApiTokenValues,
    @Request() req: express.Request
  ): Promise<ApiTokenResponse> {
    // generate here so audit event can complete first
    const tokenId = uniqueId();
    await audit(req, "api_token.create", "c", {
      target: {
        id: tokenId,
        fields: body,
      },
    });

    const newToken = await createApiToken(auth, projectId, environmentId, tokenId, body);

    this.setStatus(201);

    return {
      project_id: newToken.projectId,
      environment_id: newToken.environmentId,
      created: newToken.created.toISOString(),
      token: newToken.token,
      name: newToken.name,
      disabled: newToken.disabled,
    };
  }

  /**
   * Update an API token's fields.
   *
   *
   * @param auth              Base64 encoded JWT authentication
   * @param projectId         The project id
   * @param apiToken          The token to update
   */
  @Put("project/{projectId}/token/{apiToken}")
  @SuccessResponse("200", "OK")
  public async updateApiToken(
    @Header("Authorization") auth: string,
    @Path("projectId") projectId: string,
    @Path("apiToken") apiToken: string,
    @Body() requestBody: Partial<ApiTokenValues>,
    @Request() req: express.Request
  ): Promise<ApiTokenResponse> {
    await audit(req, "api_token.update", "u", {
      target: {
        id: apiToken,
      },
      fields: requestBody,
    });

    const updatedToken = await updateApiToken(auth, projectId, apiToken, requestBody);

    this.setStatus(200);

    return {
      project_id: updatedToken.projectId,
      environment_id: updatedToken.environmentId,
      created: updatedToken.created.toISOString(),
      token: updatedToken.token,
      name: updatedToken.name,
      disabled: updatedToken.disabled,
    };
  }

  /**
   * Delete an API token.
   *
   *
   * @param auth            Base64 encoded JWT authentication
   * @param projectId       The project id
   * @param tokenId         The token to delete
   */
  @Delete("project/{projectId}/token/{tokenId}")
  @SuccessResponse("204", "Deleted")
  public async deleteApiToken(
    @Header("Authorization") auth: string,
    @Path("projectId") projectId: string,
    @Path("tokenId") tokenId: string,
    @Request() req: express.Request
  ): Promise<void> {
    await audit(req, "api_token.delete", "d", {
      target: {
        id: tokenId,
      },
    });

    await deleteApiToken(auth, projectId, tokenId);

    this.setStatus(204);
  }

  /**
   * Create an admin token. An Admin Token can be used to impersonate a user,
   * and will have access to all the user's projects, environments, and events.
   *
   * @param auth          Base64 encoded JWT
   * @param projectId     The project id
   * @param body          The invite resource with the invitee's email
   */
  @Post("token")
  @SuccessResponse("201", "Created")
  public async createAdminToken(
    @Header("Authorization") auth: string,
    @Request() req: express.Request
  ): Promise<AdminToken> {
    await audit(req, "admin_token.create", "c");
    const { userId } = await checkAdminAccessUnwrapped(auth);
    return await this.adminTokenStore.createAdminToken(userId);
  }
}
