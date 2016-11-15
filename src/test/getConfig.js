'use strict';

const _ = require('lodash');

const expect = require('chai').expect;
const getConfig = require('../config/getConfig');

let config;
describe("getConfig", () => {
  describe("#getConfig works", () => {
    it("validates that the config is loaded and returns a valid object", () => {
      config = getConfig();
      expect(config).to.not.be.null; 
    });

    it("validates that the postgres object in the config has the appropriate keys", () => {
      const keys = _.keys(config.Postgres);
      expect(_.difference(keys, ['User', 'Database', 'Password', 'Endpoint', 'Port'])).to.have.length(0);
    })
  })
});
