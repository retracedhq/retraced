module.exports = () => {
  return {
    category: "indices",
    op: "putTemplate",
    params: {
      name: "retraced_main",
      body: {
        index_patterns: ["retraced*"],
        template: {
          settings: {
            analysis: {
              filter: {
                autocomplete_filter: {
                  type: "edge_ngram",
                  min_gram: 1,
                  max_gram: 20,
                },
              },
              analyzer: {
                autocomplete: {
                  type: "custom",
                  tokenizer: "standard",
                  filter: ["lowercase", "autocomplete_filter"],
                },
                comma_analyzer: {
                  type: "custom",
                  tokenizer: "comma_tokenizer",
                },
              },
              tokenizer: {
                comma_tokenizer: {
                  type: "pattern",
                  pattern: ",",
                },
              },
            },
          },
          mappings: {
            properties: {
              id: {
                type: "keyword",
              },
              action: {
                type: "text",
              },
              group: {
                properties: {
                  id: {
                    type: "keyword",
                  },
                  name: {
                    type: "text",
                  },
                },
              },
              crud: {
                type: "keyword",
              },
              actor: {
                properties: {
                  id: {
                    type: "keyword",
                  },
                  name: {
                    type: "text",
                  },
                },
              },
              target: {
                properties: {
                  id: {
                    type: "keyword",
                  },
                  name: {
                    type: "text",
                  },
                  type: {
                    type: "text",
                  },
                },
              },
              source_ip: {
                type: "ip",
              },
              description: {
                type: "text",
              },
              is_failure: {
                type: "boolean",
              },
              is_anonymous: {
                type: "boolean",
              },
              fields: {
                type: "object",
              },
              external_id: {
                type: "keyword",
              },
              metadata: {
                type: "object",
                enabled: false,
              },
              created: {
                type: "date",
                format: "epoch_millis",
              },
              received: {
                type: "date",
                format: "epoch_millis",
              },
              canonical_time: {
                type: "date",
                format: "epoch_millis",
              },
              raw: {
                type: "text",
                index: false,
              },
              country: {
                type: "text",
              },
              loc_subdiv1: {
                type: "text",
              },
              loc_subdiv2: {
                type: "text",
              },
            },
            dynamic_templates: [
              {
                fields: {
                  path_match: "fields.*",
                  mapping: {
                    type: "text",
                    analyzer: "comma_analyzer",
                  },
                },
              },
            ],
          },
        },
      },
    },
  };
};
