import "source-map-support/register";
import * as _ from "lodash";

import getEitapiToken from "../models/eitapi_token/get";

export default async function validateEitapiToken(authHeader) {
  // Authorization: Token token=abcdef
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.match(/token=(.+)/);
  if (parts.length < 2 || _.isEmpty(parts[1])) {
    return null;
  }

  return await getEitapiToken({ eitapiTokenId: parts[1] });
}
