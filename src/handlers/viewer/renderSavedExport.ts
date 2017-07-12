import { validateViewerDescriptorVoucher } from "../../security/vouchers";
import renderSavedExport from "../../models/saved_export/render";

export default async function(req) {
  // Note that this call needs the JWT passed in as a query string param.
  // This is because we will be calling this from window.open() in a browser,
  // and there's no way to set headers in that circumstance.
  //
  // TODO
  // Leaking the JWT is bad though, ideally this should use a single-use
  // nonce instead
  const claims = await validateViewerDescriptorVoucher(req.query.jwt);

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
};
