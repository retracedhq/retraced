import * as uuid from "uuid";

export default function uuidNoDashes(): string {
    return uuid.v4().replace(/-/g, "");
}
