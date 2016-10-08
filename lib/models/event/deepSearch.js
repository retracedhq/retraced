'use strict';

const _ = require('lodash');

const es = require('../../persistence/elasticsearch')();

function deepSearchEvents(opts) {
  return new Promise((resolve, reject) => {
    const paramsIn = opts.query;
    const results = {
      total_hits: 0,
      ids: [],
      search_id: '',
    };

    if (paramsIn.search_id) {
      const params = {
        scroll: '10m',
        scrollId: paramsIn.search_id,
      };
      es.scroll(params, (err, resp, status) => {
        if (err) {
          reject(err);
          return;
        }
        results.search_id = paramsIn.search_id;
        if (resp.hits.count > 0) {
          results.ids = _.map(resp.hits.hits, (h) => {
            return h.fields.id;
          });
        }
        resolve(results);
      });
    } else {
      let query;
      if (paramsIn.search_text) {
        query = {
          match: {
            _all: paramsIn.search_text,
          },
        };
      } else {
        query = {
          match_all: {},
        };
      }
      const params = {
        index: opts.index,
        type: 'event',
        scroll: '10m',
        fields: ['id'],
        from: paramsIn.offset,
        size: paramsIn.length,
        body: {
          query,
        },
      };
      es.search(params, (err, resp, status) => {
        if (err) {
          reject(err);
          return;
        }

        results.search_id = resp['_scroll_id'];
        results.total_hits = resp.total_hits;
        if (resp.hits.total > 0) {
          results.ids = _.map(resp.hits.hits, (h) => {
            return h.fields.id[0];
          });
        }
        resolve(results);
      });
    }
  });
}

module.exports = deepSearchEvents;
