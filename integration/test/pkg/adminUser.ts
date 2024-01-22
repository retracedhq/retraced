import assert from "assert";
import axios from "axios";
import Chance from "chance";

const chance = new Chance();

export default async function adminUser(Env) {
  const resp = await axios.post(
    `${Env.Endpoint}/admin/v1/user/_login`,
    {
      claims: {
        email: "qa@retraced.io",
      },
    },
    {
      headers: {
        Authorization: `token=${Env.AdminRootToken}`,
      },
    }
  );
  assert(resp);

  const jwt = resp.data.token;
  const userId = resp.data.user.id;

  const resp1 = await axios.post(
    `${Env.Endpoint}/admin/v1/project`,
    {
      name: chance.string(),
    },
    {
      headers: {
        Authorization: jwt,
      },
    }
  );
  assert(resp1);

  return {
    jwt,
    userId,
    project: resp1.data.project,
  };
}
