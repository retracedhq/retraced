'use strict';

const _ = require('lodash');
const chai = require('chai');
const chaiPromised = require("chai-as-promised");
const Chance = require('chance');

const listActions = require('../lib/models/action/list');
const upsertAction = require('../lib/models/action/upsert');
const updateAction = require('../lib/models/action/update');

const expect = chai.expect;
const chance = new Chance();

chai.use(chaiPromised);

describe('actions', () => {
  describe("#upsertAction works", () => {
    it("validates that there are no actions before running the test", () => {
      const opts = {
        project_id: chance.guid(),
        environment_id: chance.guid(),
      };
      return expect(listActions(opts)).to.eventually.have.length(0);
    });

    const token = {
      project_id: chance.guid(),
      environment_id: chance.guid(),
    };
    const action1 = {
      token: token,
      action: chance.word(),
    }
    const action2 = {
      token: token,
      action: chance.word(),
    };
   
    it("creates the first action", () => {
      return expect(upsertAction(action1)).to.eventually.have.property('id');
    });

    it("creates the second action", () => {
      return expect(upsertAction(action2)).to.eventually.have.property('id');
    });

    it("validates that the two new actions can be received", () => {
      const listOpts = {
        project_id: token.project_id,
        environment_id: token.environment_id,
      };
      return expect(listActions(listOpts)).to.eventually.have.length(2);
    });
  });

  describe('#updateAction works', async () => {
    const token = {
      project_id: chance.guid(),
      environment_id: chance.guid(),
    };
    const action1 = {
      token: token,
      action: chance.word(),
    }
    let action = await upsertAction(action1);

    console.log(action);

    it("sets the template on an non-existant action", () => {
      const opts = {
        display_template: 'display-template',
        action_id: chance.guid(),
      };
      return expect(updateAction(opts)).to.eventually.be.null;
    });

    it("sets the template on the newly created action", () => {
      const opts = {
        display_template: 'display-template',
        action_id: action_id,
      };
      return expect(updateAction(opts)).to.not.eventually.be.null;
    });
  })
});