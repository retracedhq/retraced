export default function uuidNoDashes(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
