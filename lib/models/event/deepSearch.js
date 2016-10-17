'use strict';

const _ = require('lodash');

const es = require('../../persistence/elasticsearch')();

function deepSearchEvents(opts) {
  return new Promise((resolve, reject) => {
    const paramsIn = opts.query;
    const results = {
      total_hits: 0,
      ids: [],
    };

    let musts = [];
    if (paramsIn.search_text) {
      musts.push({
        multi_match: {
          query: paramsIn.search_text,
          fields: ['title', 'description', 'action', 'fields.*', 'actor.name', 'actor.fields.*', 'object.name', 'object.fields.*'],
        },
      });
    } else {
      musts.push({
        match_all: {},
      });
    }

    // Restrict query to specific teamid.
    musts.push({
      term: {
        team_id: opts.team_id,
      },
    });

    // For now, we omit any events with a CRUD value of "r"(ead)
    const query = {
      bool: {
        must: musts,
        must_not: [
          { match: {
            crud: 'r',
          } },
        ],
      },
    };

    const params = {
      index: opts.index,
      type: 'event',
      fields: ['id'],
      from: paramsIn.offset || 0,
      size: paramsIn.length,
      sort: 'created:desc',
      body: {
        query,
      },
    };
    es.search(params, (err, resp, status) => {
      if (err) {
        reject(err);
        return;
      }

      results.total_hits = resp.hits.total;
      if (resp.hits.total > 0) {
        results.ids = _.map(resp.hits.hits, (h) => {
          return h.fields.id[0];
        });
      }
      resolve(results);
    });
  });
}

module.exports = deepSearchEvents;
