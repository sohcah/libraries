import type { OpenApiGenerator } from "./core.js";

export interface OpenApiConfigBase {
  schema: string;
}

export interface OpenApiConfig<
  Builders extends Record<string, OpenApiGenerator>,
> extends OpenApiConfigBase {
  builders: Builders;
}

export interface OpenApiConfigBuilder<Builders extends Record<string, OpenApiGenerator>> {
  schema: string;
  addBuilder: <Name extends string, Builder extends OpenApiGenerator>(
    name: Exclude<Name, keyof Builders>,
    builder: (config: OpenApiConfig<Builders>) => Builder,
  ) => OpenApiConfigBuilder<Builders & { [K in Name]: Builder }>;
  build: () => OpenApiConfig<Builders>;
}

class OpenApiConfigBuilderImpl<
  Builders extends Record<string, OpenApiGenerator>,
> implements OpenApiConfigBuilder<Builders> {
  #config: OpenApiConfigBase;
  #builders: { name: string; builder: (config: OpenApiConfig<Builders>) => OpenApiGenerator }[];

  constructor(
    config: OpenApiConfigBase,
    builders: { name: string; builder: (config: OpenApiConfig<Builders>) => OpenApiGenerator }[],
  ) {
    this.#config = config;
    this.#builders = builders;
  }

  get schema() {
    return this.#config.schema;
  }

  addBuilder<Name extends string, Builder extends OpenApiGenerator>(
    name: Exclude<Name, keyof Builders>,
    builder: (config: OpenApiConfig<Builders>) => Builder,
  ): OpenApiConfigBuilder<Builders & { [K in Name]: Builder }> {
    return new OpenApiConfigBuilderImpl<Builders & { [K in Name]: Builder }>(this.#config, [
      ...this.#builders,
      { name, builder },
    ]);
  }

  build(): OpenApiConfig<Builders> {
    const config: OpenApiConfig<Builders> = {
      schema: this.#config.schema,
      builders: {} as Builders,
    };
    for (const { name, builder } of this.#builders) {
      // @ts-expect-error - Hard to type this
      config.builders[name] = builder(config);
    }
    return config;
  }
}

export function defineConfig(config: OpenApiConfigBase): OpenApiConfigBuilder<{}> {
  return new OpenApiConfigBuilderImpl<{}>(config, []);
}
