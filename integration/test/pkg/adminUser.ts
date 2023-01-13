import Chance from "chance";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

const chance = new Chance();

export default async function adminUser(Env) {
  return new Promise((resolve, reject) => {
    chai
      .request(Env.Endpoint)
      .post("/admin/v1/user/_login")
      .set("Authorization", `token=${Env.AdminRootToken}`)
      .send({
        claims: {
          email: "qa@retraced.io",
        },
      })
      .end((err, res) => {
        if (err) {
          reject(err);
        }
        const jwt = res.body.token;
        const userId = res.body.user.id;
        chai
          .request(Env.Endpoint)
          .post("/admin/v1/project")
          .set("Authorization", jwt)
          .send({
            name: chance.string(),
          })
          .end((err, res) => {
            if (err) {
              reject(err);
            }
            // hydrated with environments and tokens
            resolve({
              jwt,
              userId,
              project: res.body.project,
            });
          });
      });
  });
}
