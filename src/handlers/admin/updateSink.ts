import { checkAdminAccess } from "../../security/helpers";
import updateSink from "../../models/vectorsink/update";

export default async function (req) {
  await checkAdminAccess(req);

  if (!req.body.name) {
    return {
      status: 400,
      body: JSON.stringify({ error: "Name is required" }),
    };
  } else if (
    req.body.config === undefined ||
    req.body.config === null ||
    typeof req.body.config !== "object"
  ) {
    return {
      status: 400,
      body: JSON.stringify({ error: "Config is required" }),
    };
  } else if (Object.keys(req.body.config).length === 0) {
    return {
      status: 400,
      body: JSON.stringify({ error: "Config cannot be empty" }),
    };
  } else {
    const res = await updateSink(req.params.sinkId, {
      name: req.body.name,
      config: req.body.config,
      active: req.body.active,
    });

    return {
      status: 200,
      body: JSON.stringify({ updated: res }),
    };
  }
}
