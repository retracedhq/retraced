import getApiToken from "../models/api_token/get";
import { apiTokenFromAuthHeader } from "../security/helpers";
import createViewerDescriptor from "../models/viewer_descriptor/create";

/**
 * @swagger
 * definitions:
 *   ViewerToken:
 *     properties:
 *       token:
 *         type: string
 */

/**
 * @swagger
 * /publisher/v1/project/:projectId/viewertoken:
 *   get:
 *     tags:
 *       - token
 *       - viewer
 *     description: Create a token for use with the embedded logs viewer
 *     produces:
 *       - application/json
 *     responses:
 *       201:
 *         description: A created viewer Token
 *         schema:
 *           $ref: '#/definitions/ViewerToken'
 */
export default async function handler(req) {
  const apiTokenId = apiTokenFromAuthHeader(req.get("Authorization"));
  const apiToken: any = await getApiToken(apiTokenId);
  const validAccess = apiToken && apiToken.project_id === req.params.projectId;
  if (!validAccess) {
    throw { status: 401, err: new Error("Unauthorized") };
  }

  const newDesc = await createViewerDescriptor({
    projectId: req.params.projectId,
    environmentId: apiToken.environment_id,
    groupId: req.query.group_id || req.query.team_id,
    isAdmin: req.query.is_admin === "true",
    targetId: req.query.target_id || null,
  });

  return {
    status: 201,
    body: JSON.stringify({ token: newDesc.id }),
  };
}
