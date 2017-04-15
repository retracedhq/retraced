import * as _ from "lodash";

import { checkAdminAccess } from "../../security/helpers";
import listProjects from "../../models/project/list";
import hydrateProject from "../../models/project/hydrate";

export default async function(req) {
  const claims = await checkAdminAccess(req);

  const projects = await listProjects({
    user_id: claims.userId,
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
