import moment from "moment";

export interface TemplateValues {
  id?: string;
  name: string;
  rule: string;
  template: string;
}

export interface Template extends TemplateValues {
  id: string;
  project_id: string;
  environment_id: string;
  created: moment.Moment;
  updated: null | moment.Moment;
}

export interface TemplateResponse extends TemplateValues {
  id: string;
  project_id: string;
  environment_id: string;
  created: string;
  updated: null | string;
}

export function responseFromTemplate(tmpl: Template): TemplateResponse {
  return Object.assign(tmpl, {
    created: tmpl.created.format(),
    updated: tmpl.updated ? tmpl.updated.format() : null,
  });
}

export interface TemplateSearchResults {
  total_hits: number;
  templates: TemplateResponse[];
}
