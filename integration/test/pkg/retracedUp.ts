
const chai = require("chai")
    , chaiHttp = require("chai-http");
chai.use(chaiHttp);

export const retracedUp = (Env) => (done) => {
    chai.request(Env.Endpoint)
        .get("/")
        .end(function (err, res) {
            chai.expect(err).to.be.null;
            chai.expect(res).to.have.status(200);
            done();
        });
};
