'use strict';

const _ = require('lodash');
const util = require('util');

const es = require('../../persistence/elasticsearch')();

function deepSearchEvents(opts) {
  return new Promise((resolve, reject) => {
    const paramsIn = opts.query;
    const results = {
      total_hits: 0,
      ids: [],
    };

    const filters = [];
    if (paramsIn.search_text) {
      filters.push({ multi_match: {
        query: paramsIn.search_text,
        fields: [
          'title',
          'description',
          'action',
          'fields.*',
          'actor.name',
          'actor.fields.*',
          'object.name',
          'object.fields.*',
        ],
      } });
    }

    if (paramsIn.start_time) {
      filters.push({
        bool: {
          should: [
            { bool: {
              must_not: { exists: { field: 'created' } },
              must: { range: { received: { gte: paramsIn.start_time } } },
            } },
            { range: { created: { gte: paramsIn.start_time } } },
          ],
        },
      });
    }
    if (paramsIn.end_time) {
      filters.push({
        bool: {
          should: [
            { bool: {
              must_not: { exists: { field: 'created' } },
              must: { range: { received: { lte: paramsIn.end_time } } },
            } },
            { range: { created: { lte: paramsIn.end_time } } },
          ],
        },
      });
    }

    // Restrict query to specific teamid.
    if (!opts.team_omitted) {
      filters.push({
        term: {
          team_id: opts.team_id,
        },
      });
    }

    const mustNots = [];
    if (!paramsIn.create) {
      mustNots.push({ term: { crud: 'c' } });
    }
    if (!paramsIn.read) {
      mustNots.push({ term: { crud: 'r' } });
    }
    if (!paramsIn.update) {
      mustNots.push({ term: { crud: 'u' } });
    }
    if (!paramsIn.delete) {
      mustNots.push({ term: { crud: 'd' } });
    }

    const query = {
      bool: {
        filter: filters,
        must_not: mustNots,
      },
    };

    const params = {
      index: opts.index,
      type: 'event',
      fields: ['id'],
      _source: false,
      from: paramsIn.offset || 0,
      size: paramsIn.length,
      sort: [
        'created:desc',
        'received:desc',
      ],
      body: {
        query,
      },
    };

    const readableParams = JSON.stringify(params, null, 2);
    console.log(`Elasticsearch search request: ${readableParams}`);

    es.search(params, (err, resp, status) => {
      if (err) {
        console.log(err.stack);
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
