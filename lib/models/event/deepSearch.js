'use strict';

const _ = require('lodash');

const es = require('../../persistence/elasticsearch')();

function deepSearchEvents(opts) {
  return new Promise((resolve, reject) => {
    const paramsIn = opts.query;
    const results = {
      ids: [],
      search_id: '',
    };

    if (!paramsIn.search_text) {
      reject(new Error('[400] Missing "search_text" parameter'));
      return;
    }

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
      const params = {
        index: opts.index,
        type: 'event',
        scroll: '10m',
        fields: ['id'],
        from: paramsIn.offset,
        size: paramsIn.length,
        body: {
          query: {
            match: {
              _all: paramsIn.search_text,
            },
          },
        },
      };
      es.search(params, (err, resp, status) => {
        if (err) {
          reject(err);
          return;
        }

        results.search_id = resp['_scroll_id'];
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
