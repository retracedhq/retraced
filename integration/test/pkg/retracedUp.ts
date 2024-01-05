import assert from "assert";
import axios from "axios";

export const retracedUp = (Env) => async () => {
  const res = await axios.get(Env.Endpoint);
  assert.strictEqual(res.status, 200);
};
