import type { OpenApiGenerator } from "./core.js";

export interface OpenApiConfigBase {
  schema: string;
}

export interface OpenApiConfig<
  Builders extends Record<string, OpenApiGenerator>,
> extends OpenApiConfigBase {
  builders: Builders;
}

export interface OpenApiConfigBuilder<
  Builders extends Record<string, OpenApiGenerator>,
> extends OpenApiConfig<Builders> {
  addBuilder: <Name extends string, Builder extends OpenApiGenerator>(
    name: Name,
    builder: (config: OpenApiConfig<Builders>) => Builder,
  ) => OpenApiConfigBuilder<Builders & { [K in Name]: Builder }>;
}

class OpenApiConfigBuilderImpl<
  Builders extends Record<string, OpenApiGenerator>,
> implements OpenApiConfigBuilder<Builders> {
  #config: OpenApiConfigBase;
  #builders: Builders;

  constructor(config: OpenApiConfigBase, builders: Builders) {
    this.#config = config;
    this.#builders = builders;
  }

  get schema() {
    return this.#config.schema;
  }

  get builders() {
    return this.#builders;
  }

  addBuilder<Name extends string, Builder extends OpenApiGenerator>(
    name: Name,
    builder: (config: OpenApiConfig<Builders>) => Builder,
  ): OpenApiConfigBuilder<Builders & { [K in Name]: Builder }> {
    return new OpenApiConfigBuilderImpl<Builders & { [K in Name]: Builder }>(this.#config, {
      ...this.#builders,
      [name]: builder(this),
    });
  }
}

export function defineConfig(config: OpenApiConfigBase): OpenApiConfigBuilder<{}> {
  return new OpenApiConfigBuilderImpl<{}>(config, {});
}
