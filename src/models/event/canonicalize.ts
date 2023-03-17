import _ from "lodash";
import crypto from "crypto";

import Event from "./";

const requiredFields = ["id", "action"];

const requiredSubfields = [
  ["group", "group.id"],
  ["actor", "actor.id"],
  ["target", "target.id"],
];

// Produces a canonical hash string representation of an event.
// See the Swagger spec for more details.
export default function (event: Event): string {
  for (const fieldName of requiredFields) {
    if (_.isEmpty(_.get(event, fieldName))) {
      throw new Error(`Canonicalization failed: missing required event attribute '${fieldName}'`);
    }
  }

  for (const [field, requiredSubfield] of requiredSubfields) {
    const hasField = !_.isEmpty(_.get(event, field));
    const missingSubfield = hasField && _.isEmpty(_.get(event, requiredSubfield));
    if (missingSubfield) {
      throw new Error(
        `Canonicalization failed: missing attribute '${requiredSubfield}' which is required when '${field}' is present`
      );
    }
  }

  let canonicalString = "";
  canonicalString += `${encodePassOne(event.id || "")}:`;
  canonicalString += `${encodePassOne(event.action)}:`;
  canonicalString += _.isEmpty(event.target) ? ":" : `${encodePassOne(event.target?.id)}:`;
  canonicalString += _.isEmpty(event.actor) ? ":" : `${encodePassOne(event.actor?.id)}:`;
  canonicalString += _.isEmpty(event.group) ? ":" : `${encodePassOne(event.group?.id)}:`;
  canonicalString += _.isEmpty(event.source_ip) ? ":" : `${encodePassOne(event.source_ip || "")}:`;
  canonicalString += event.is_failure ? "1:" : "0:";
  canonicalString += event.is_anonymous ? "1:" : "0:";

  if (!event.fields) {
    canonicalString += ":";
  } else {
    const sortedKeys = _.keys(event.fields).sort();
    for (const key of sortedKeys) {
      const value = event.fields[key];
      const encodedKey = encodePassTwo(encodePassOne(key));
      const encodedValue = encodePassTwo(encodePassOne(value));
      canonicalString += `${encodedKey}=${encodedValue};`;
    }
  }

  if (event.external_id) {
    canonicalString += `:${encodePassOne(event.external_id)}`;
  }

  if (event.indexes) {
    canonicalString += ":";
    const sortedKeys = _.keys(event.indexes).sort();
    for (const key of sortedKeys) {
      const value = event.indexes[key];
      const encodedKey = encodePassTwo(encodePassOne(key));
      const encodedValue = encodePassTwo(encodePassOne(value));
      canonicalString += `${encodedKey}=${encodedValue};`;
    }
  }

  const hasher = crypto.createHash("sha256");
  hasher.update(canonicalString);
  const hashResult = hasher.digest("hex");

  return hashResult;
}

function encodePassOne(valueIn: string): string {
  // % -> %25
  // : -> %3A
  return valueIn ? (valueIn.replace ? valueIn.replace(/%/g, "%25").replace(/:/g, "%3A") : valueIn) : valueIn;
}

function encodePassTwo(valueIn: string): string {
  // = -> %3D
  // ; -> %3B
  return valueIn ? (valueIn.replace ? valueIn.replace(/=/g, "%3D").replace(/;/g, "%3B") : valueIn) : valueIn;
}
