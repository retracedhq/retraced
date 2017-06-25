import { checkAdminAccess, checkAdminAccessUnwrapped } from "../../security/helpers";
import deleteApiToken from "../../models/api_token/delete";

export async function deprecated(req) {
    await checkAdminAccess(req);

    await deleteApiToken({
        projectId: req.params.projectId,
        tokenId: req.params.tokenId,
    });

    return {
        status: 204,
    };
}

export default async function(
    auth: string,
    projectId: string,
    tokenId: string,
): Promise<void> {
    await checkAdminAccessUnwrapped(auth, projectId);

    await deleteApiToken({
        projectId,
        tokenId,
    });
}
