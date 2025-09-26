/**
 * Types for the Postman Collection Generator
 */

export interface ParameterInfo {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: string;
  /** Whether parameter is required */
  required: boolean;
  /** Parameter location (path, query, body) */
  location: 'path' | 'query' | 'body';
  /** Parameter description */
  description?: string;
  /** Default value */
  defaultValue?: string | number | boolean | null;
}

export interface PostmanCollection {
  info: {
    name: string;
    description: string;
    schema: string;
    version: string;
  };
  item: PostmanItem[];
  variable: PostmanVariable[];
  event?: PostmanEvent[];
}

export interface PostmanItem {
  name: string;
  item?: PostmanItem[];
  request?: PostmanRequest;
  response?: PostmanResponse[];
  event?: PostmanEvent[];
}

export interface PostmanRequest {
  method: string;
  header: PostmanHeader[];
  url: string | PostmanUrl;
  body?: PostmanBody;
  description?: string;
}

export interface PostmanResponse {
  name: string;
  originalRequest: PostmanRequest;
  status: string;
  code: number;
  _postman_previewlanguage: string;
  header: PostmanHeader[];
  cookie: PostmanCookie[];
  body: string;
}

export interface PostmanCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
}

export interface PostmanHeader {
  key: string;
  value: string;
  type: string;
  description?: string;
}

export interface PostmanUrl {
  raw: string;
  protocol?: string;
  host?: string[];
  port?: string;
  path?: string[];
  query?: PostmanQueryParam[];
  variable?: PostmanUrlVariable[];
}

export interface PostmanQueryParam {
  key: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface PostmanUrlVariable {
  key: string;
  value: string;
  description?: string;
}

export interface PostmanBody {
  mode: string;
  raw?: string;
  urlencoded?: PostmanFormData[];
  formdata?: PostmanFormData[];
  options?: PostmanBodyOptions;
}

export interface PostmanBodyOptions {
  raw?: {
    language: string;
  };
  urlencoded?: {
    disabled?: boolean;
  };
  formdata?: {
    disabled?: boolean;
  };
}

export interface PostmanFormData {
  key: string;
  value: string;
  type: string;
  description?: string;
  disabled?: boolean;
}

export interface PostmanVariable {
  key: string;
  value: string;
  type: string;
  description?: string;
}

export interface PostmanEvent {
  listen: string;
  script: {
    type: string;
    exec: string[];
  };
}
