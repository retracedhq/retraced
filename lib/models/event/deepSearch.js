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

    const must = [];
    if (paramsIn.search_text) {
      must.push({ multi_match: {
        query: paramsIn.search_text,
        fields: ['title', 'description', 'action', 'fields.*', 'actor.name', 'actor.fields.*', 'object.name', 'object.fields.*'],
      } });
    }

    if (paramsIn.start_time || paramsIn.end_time) {
      let rangeObj = { range: { created: {} } };
      if (paramsIn.start_time) {
        rangeObj.range.created.gte = paramsIn.start_time;
      }
      if (paramsIn.end_time) {
        rangeObj.range.created.lt = paramsIn.end_time;
      }
      must.push(rangeObj);
    } else if (!paramsIn.search_text) {
      must.push({ match_all: {} });
    }

    // Restrict query to specific teamid.
    must.push({
      term: {
        team_id: opts.team_id,
      },
    });

    // For now, we omit any events with a CRUD value of "r"(ead)
    const query = {
      bool: {
        must,
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
