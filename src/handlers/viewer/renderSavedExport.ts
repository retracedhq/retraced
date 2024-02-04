import { validateViewerDescriptorVoucher } from "../../security/vouchers";
import { checkViewerAccess } from "../../security/helpers";
import renderSavedExport from "../../models/saved_export/render";
import ViewerDescriptor from "../../models/viewer_descriptor/def";

export default async function (req) {
  // Older viewers will pass JWT in request query. Newer viewers will pass JWT in the authorization header.
  let claims: ViewerDescriptor;
  if (req.query.jwt) {
    claims = await validateViewerDescriptorVoucher(req.query.jwt);
  } else {
    claims = await checkViewerAccess(req);
  }

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
    environmentId: claims.environmentId,
    projectId: req.params.projectId,
    savedExportId: req.params.exportId,
    groupId: claims.groupId,
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
}
