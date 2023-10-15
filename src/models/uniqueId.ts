import { randomUUID } from "crypto";

export default function uuidNoDashes(): string {
  return randomUUID().replace(/-/g, "");
}
