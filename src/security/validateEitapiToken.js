import * as _ from "lodash";

import getEitapiToken from "../models/eitapi_token/get";

export default async function validateEitapiToken(authHeader) {
  // Authorization: Token token=abcdef
  const parts = authHeader.match(/token=(.+)/);
  if (parts.length < 2 || _.isEmpty(parts[1])) {
    throw new Error("Bad authorization data");
  }
  return await getEitapiToken({ eitapiTokenId: parts[1] });
}
