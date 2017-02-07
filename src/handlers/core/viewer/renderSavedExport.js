import "source-map-support/register";
import validateSession from "../../../security/validateSession";
import renderSavedExport from "../../../models/saved_export/render";

export default async function handler(req) {
  // Note that this call needs the JWT passed in as a query string param.
  // This is because we will be calling this from window.open() in a browser,
  // and there's no way to set headers in that circumstance.
  const claims = await validateSession("viewer", req.query.jwt);
  const format = req.query.format || "csv";
  let contentType;
  switch (format) {
    case "csv":
      contentType = "text/csv";
      break;
    default:
      contentType = "text/plain";
  }

  const result = await renderSavedExport({
    environmentId: claims.environment_id,
    projectId: req.params.projectId,
    savedExportId: req.params.exportId,
    teamId: claims.team_id,
    format,
  });

  if (!result) {
    return {
      status: 404,
      body: JSON.stringify({ error: "No results found" }),
    };
  }

  return {
    status: 200,
    contentType,
    body: result.rendered,
    filename: result.filename,
  };
};
