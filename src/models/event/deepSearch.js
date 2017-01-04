import getEs from "../../persistence/elasticsearch";

const es = getEs();

export default async function deepSearchEvents(opts) {
  const paramsIn = opts.query;
  const results = {
    total_hits: 0,
    ids: [],
  };

  const filters = [];
  if (paramsIn.search_text) {
    filters.push({
      multi_match: {
        query: paramsIn.search_text,
        fields: [
          "title",
          "description",
          "action",
          "fields.*",
          "actor.name",
          "actor.fields.*",
          "object.name",
          "object.fields.*",
        ],
      },
    });
  }

  if (paramsIn.start_time) {
    filters.push({
      bool: {
        should: [
          {
            bool: {
              must_not: { exists: { field: "created" } },
              must: { range: { received: { gte: paramsIn.start_time } } },
            },
          },
          { range: { created: { gte: paramsIn.start_time } } },
        ],
      },
    });
  }
  if (paramsIn.end_time) {
    filters.push({
      bool: {
        should: [
          {
            bool: {
              must_not: { exists: { field: "created" } },
              must: { range: { received: { lte: paramsIn.end_time } } },
            },
          },
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
    mustNots.push({ term: { crud: "c" } });
  }
  if (!paramsIn.read) {
    mustNots.push({ term: { crud: "r" } });
  }
  if (!paramsIn.update) {
    mustNots.push({ term: { crud: "u" } });
  }
  if (!paramsIn.delete) {
    mustNots.push({ term: { crud: "d" } });
  }

  const query = {
    bool: {
      filter: filters,
      must_not: mustNots,
    },
  };

  const params = {
    index: opts.index,
    type: "event",
    fields: ["id"],
    _source: false,
    from: paramsIn.offset || 0,
    size: opts.fetchAll ? 5000 : paramsIn.length,
    sort: [
      "created:desc",
      "received:desc",
    ],
    body: {
      query,
    },
  };

  if (opts.fetchAll) {
    params.scroll = "1m";
    let initialResp = await es.search(params);
    if (initialResp.hits.total > 0) {
      const scrollParams = {
        scroll_id: initialResp._scroll_id,
        scroll: "1m",
      };
      results.total_hits = initialResp.hits.total;
      const newIds = initialResp.hits.hits.map((h) => {
        return h.fields.id[0];
      });
      results.ids.push(...newIds);
      while (true) {
        const resp = await es.scroll(scrollParams);
        if (resp.hits.hits.length === 0) {
          break;
        }
        const newIds = resp.hits.hits.map((h) => {
          return h.fields.id[0];
        });
        results.ids.push(...newIds);
        scrollParams.scroll_id = resp._scroll_id;
      }
    }
  } else {
    const resp = await es.search(params);
    results.total_hits = resp.hits.total;
    if (resp.hits.total > 0) {
      results.ids = resp.hits.hits.map((h) => {
        return h.fields.id[0];
      });
    }
  }

  return results;
}
