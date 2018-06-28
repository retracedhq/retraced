module.exports = () => {
  return {
    category: 'indices',
    op: 'putTemplate',
    params: {
      name: 'retraced_main',
      body: {
        template: 'retraced*',
        settings: {
          analysis: {
            filter: {
              autocomplete_filter: {
                type: 'edge_ngram',
                min_gram: 1,
                max_gram: 20,
              },
            },
            analyzer: {
              autocomplete: {
                type: 'custom',
                tokenizer: 'standard',
                filter: [
                  'lowercase',
                  'autocomplete_filter',
                ],
              },
            },
          },
        },
        mappings: {
          event: {
            dynamic_templates: [
              {
                event_fields: {
                  match: 'event.fields.*',
                  match_mapping_type: 'string',
                  mapping: {
                    type: 'string',
                  },
                }
              },
              {
                target_fields: {
                  match: 'event.target.fields.*',
                  match_mapping_type: 'string',
                  mapping: {
                    type: 'string',
                  },
                }
              },
              {
                actor_fields: {
                  match: 'event.actor.fields.*',
                  match_mapping_type: 'string',
                  mapping: {
                    type: 'string',
                  },
                }
              },
            ],
            _source: {
              enabled: true,
            },
            properties: {
              id: {
                type: 'string',
                index: 'not_analyzed',
              },

              action: {
                type: 'string',
              },

              group: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    index: 'not_analyzed',
                  },
                  name: {
                    type: 'string',
                  },
                },
              },

              actor: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    index: 'not_analyzed',
                  },
                  name: {
                    type: 'string',
                  },
                },
              },

              target: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    index: 'not_analyzed',
                  },
                  name: {
                    type: 'string',
                  },
                  type: {
                    type: 'string',
                  },
                },
              },

              description: {
                type: 'string',
              },

              created: {
                type: 'date',
                format: 'epoch_millis',
              },

              received: {
                type: 'date',
                format: 'epoch_millis',
              },

              canonical_time: {
                type: 'date',
                format: 'epoch_millis',
              },

              source_ip: {
                type: 'ip',
              },

              raw: {
                type: 'string',
                index: 'not_analyzed',
              },

              country: {
                type: 'string',
              },

              loc_subdiv1: {
                type: 'string',
              },

              loc_subdiv2: {
                type: 'string',
              },

              fields: {
                type: 'object',
              },

            },
          },
        },
      },
    },
  };
};
