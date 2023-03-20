module.exports = () => {
  return {
    category: "indices",
    op: "putTemplate",
    params: {
      name: "retraced_main",
      body: {
        template: "retraced*",
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
            description: {
              type: "text",
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
            source_ip: {
              type: "ip",
            },
            raw: {
              type: "text",
              index: false,
            },
            country: {
              type: "text",
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
  };
};
