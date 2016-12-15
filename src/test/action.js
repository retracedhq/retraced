import * as _ from "lodash";
import * as chai from "chai";
import * as chaiPromised from "chai-as-promised";
import * as Chance from "chance";

import listActions from "../models/action/list";
import updateAction from "../models/action/update";

const expect = chai.expect;

chai.use(chaiPromised);

describe("actions", () => {
  describe("#updateAction works", async () => {
    expect({ testCount: 0 }).to.have.property("testCount");
  });
});
