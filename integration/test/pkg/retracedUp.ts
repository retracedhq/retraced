import assert from "assert";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

export const retracedUp = (Env) => (done) => {
  chai
    .request(Env.Endpoint)
    .get("/")
    .end(function (err, res) {
      assert.strictEqual(err, null);
      assert.strictEqual(res.status, 200);
      done();
    });
};
