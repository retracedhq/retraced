import { checkAdminAccess } from "../../security/helpers";
import listProjects from "../../models/project/list";
import listAllProjects from "../../models/project/listall";
import hydrateProject from "../../models/project/hydrate";

export default async function (req) {
  const claims = await checkAdminAccess(req);
  const page = req.query.page;
  const count = req.query.count;
  const projects = claims.adminToken
    ? await listAllProjects({
        page,
        count,
      })
    : await listProjects({
        user_id: claims.userId,
        page,
        count,
      });

  const hydratedProjects: any[] = [];
  for (const projId in projects) {
    if (!projects.hasOwnProperty(projId)) {
      continue;
    }
    const hydrated = await hydrateProject(projects[projId]);
    hydratedProjects.push(hydrated);
  }

  return {
    status: 200,
    body: JSON.stringify({ projects: hydratedProjects }),
  };
}
