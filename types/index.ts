import { Schema } from "effect";

export const SecurityRequirement = Schema.Struct({});

export const OAuthFlow = Schema.Struct({});

export const OAuthFlows = Schema.Struct({});

export const SecurityScheme = Schema.Struct({});

export const Xml = Schema.Struct({});

export const Discriminator = Schema.Struct({});

export const SchemaObject = Schema.Struct({});

export const Reference = Schema.Struct({});

export const Tag = Schema.Struct({});

export const Header = Schema.Struct({});

export const Link = Schema.Struct({});

export const Example = Schema.Struct({});

export const Callback = Schema.Struct({});

export const Response = Schema.Struct({});

export const Responses = Schema.Struct({});

export const Encoding = Schema.Struct({});

export const MediaType = Schema.Struct({});

export const RequestBody = Schema.Struct({});

export const Parameter = Schema.Struct({
  name: Schema.String,
  in: Schema.Literal("query", "header", "path", "cookie"),
  description: Schema.String.pipe(Schema.optional),
  required: Schema.Boolean.pipe(Schema.optional),
  deprecated: Schema.Boolean.pipe(Schema.optional),
  allowEmptyValue: Schema.Boolean.pipe(Schema.optional),
});

export const ExternalDocumentation = Schema.Struct({
  description: Schema.String.pipe(Schema.optional),
  url: Schema.URL,
});

export const Operation = Schema.Struct({
  tags: Schema.Array(Schema.String).pipe(Schema.optional),
  summary: Schema.String.pipe(Schema.optional),
  description: Schema.String.pipe(Schema.optional),
  externalDocs: ExternalDocumentation.pipe(Schema.optional),
  operationId: Schema.String.pipe(Schema.optional),
  parameters: Schema.Array(Schema.Union(Parameter, Reference)).pipe(Schema.optional),
  requestBody: Schema.Union(RequestBody, Reference).pipe(Schema.optional),
  responses: Responses.pipe(Schema.optional),
  callbacks: Schema.Record({ key: Schema.String, value: Schema.Union(Callback, Reference) }).pipe(
    Schema.optional
  ),
  deprecated: Schema.Boolean.pipe(Schema.optional),
  security: Schema.Array(SecurityRequirement).pipe(Schema.optional),
  servers: Schema.Array(Schema.suspend(() => Server)).pipe(Schema.optional),
});

export const PathItem = Schema.Struct({
  $ref: Schema.String.pipe(Schema.optional),
  summary: Schema.String.pipe(Schema.optional),
  description: Schema.String.pipe(Schema.optional),
  get: Schema.Union(Operation, Reference).pipe(Schema.optional),
  put: Schema.Union(Operation, Reference).pipe(Schema.optional),
  post: Schema.Union(Operation, Reference).pipe(Schema.optional),
  delete: Schema.Union(Operation, Reference).pipe(Schema.optional),
  options: Schema.Union(Operation, Reference).pipe(Schema.optional),
  head: Schema.Union(Operation, Reference).pipe(Schema.optional),
  patch: Schema.Union(Operation, Reference).pipe(Schema.optional),
  trace: Schema.Union(Operation, Reference).pipe(Schema.optional),
  servers: Schema.Array(Schema.suspend(() => Server)).pipe(Schema.optional),
  parameters: Schema.Array(Schema.Union(Parameter, Reference)).pipe(Schema.optional),
});

export const Paths = Schema.Record({
  key: Schema.String,
  value: PathItem,
});

export const Components = Schema.Struct({
  schemas: Schema.Record({ key: Schema.String, value: SchemaObject }).pipe(
    Schema.optional
  ),
  responses: Schema.Record({ key: Schema.String, value: Schema.Union(Response, Reference) }).pipe(
    Schema.optional
  ),
  parameters: Schema.Record({ key: Schema.String, value: Schema.Union(Parameter, Reference) }).pipe(
    Schema.optional
  ),
  examples: Schema.Record({ key: Schema.String, value: Schema.Union(Example, Reference) }).pipe(
    Schema.optional
  ),
  requestBodies: Schema.Record({ key: Schema.String, value: Schema.Union(RequestBody, Reference) }).pipe(
    Schema.optional
  ),
  headers: Schema.Record({ key: Schema.String, value: Schema.Union(Header, Reference) }).pipe(
    Schema.optional
  ),
  securitySchemes: Schema.Record({ key: Schema.String, value: Schema.Union(SecurityScheme, Reference) }).pipe(
    Schema.optional
  ),
  links: Schema.Record({ key: Schema.String, value: Schema.Union(Link, Reference) }).pipe(
    Schema.optional
  ),
  callbacks: Schema.Record({ key: Schema.String, value: Schema.Union(Callback, Reference) }).pipe(
    Schema.optional
  ),
  pathItems: Schema.Record({ key: Schema.String, value: PathItem }).pipe(
    Schema.optional
  ),
});

export const ServerVariable = Schema.Struct({
  enum: Schema.Array(Schema.String).pipe(Schema.optional),
  default: Schema.String,
  description: Schema.String.pipe(Schema.optional),
});

export const Server = Schema.Struct({
  url: Schema.URL,
  description: Schema.String.pipe(Schema.optional),
  variables: Schema.Record({ key: Schema.String, value: ServerVariable }).pipe(
    Schema.optional
  ),
});

export const License = Schema.Struct({
  name: Schema.String,
  url: Schema.URL.pipe(Schema.optional),
  identifier: Schema.String.pipe(Schema.optional),
});

export const Contact = Schema.Struct({
  name: Schema.String.pipe(Schema.optional),
  url: Schema.URL.pipe(Schema.optional),
  email: Schema.String.pipe(Schema.optional),
});

export const Info = Schema.Struct({
  title: Schema.String,
  summary: Schema.String.pipe(Schema.optional),
  description: Schema.String.pipe(Schema.optional),
  termsOfService: Schema.URL.pipe(Schema.optional),
  contact: Contact.pipe(Schema.optional),
  license: License.pipe(Schema.optional),
  version: Schema.String,
});

export const OpenAPI = Schema.Struct({
  openapi: Schema.String,
  info: Info,
  jsonSchemaDialect: Schema.String.pipe(Schema.optional),
  servers: Schema.Array(Server).pipe(Schema.optional),
  paths: Paths.pipe(Schema.optional),
  webhooks: Schema.Record({ key: Schema.String, value: PathItem }).pipe(
    Schema.optional
  ),
  components: Components.pipe(Schema.optional),
  security: Schema.Array(SecurityRequirement).pipe(Schema.optional),
  tags: Schema.Array(Tag).pipe(Schema.optional),
  externalDocs: ExternalDocumentation.pipe(Schema.optional),
});
