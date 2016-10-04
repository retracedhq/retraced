'use strict';

const elasticsearch = require('elasticsearch');
const _ = require('lodash');

const config = require('../config/getConfig')();

let es;

function getElasticsearch() {
  if (!es) {
    const c = config.Elasticsearch;
    const hosts = _.map(c.Endpoints, (e) => {
      return `${c.Protocol}://${c.User}:${c.Password}@${e}:${c.Port}/`;
    });
    es = new elasticsearch.Client({ hosts });
  }

  return es;
}

module.exports = getElasticsearch;
