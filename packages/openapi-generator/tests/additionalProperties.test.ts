import { test, expect } from "vitest";

import { generate } from "../src/index.js";
import { Effect } from "effect";
import { createReactQueryClientGenerator } from "../src/generators/client.js";
import { createEffectSchemaGenerator } from "../src/generators/effect.js";
import { createZodSchemaGenerator } from "../src/generators/zod.js";

test("additionalProperties - no properties with schema object (record) - zod", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        RecordSchema: {
          type: "object",
          additionalProperties: {
            type: "integer",
          },
        },
      },
    },
  };

  const result = await Effect.runPromise(
    generate({
      schema,
      generators: [
        createReactQueryClientGenerator({
          schema: createZodSchemaGenerator({ includeSchemas: true }),
        }),
      ],
    })
  );

  expect(result).toMatchSnapshot();
});

test("additionalProperties - no properties with schema object (record) - effect", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        RecordSchema: {
          type: "object",
          additionalProperties: {
            type: "integer",
          },
        },
      },
    },
  };

  const result = await Effect.runPromise(
    generate({
      schema,
      generators: [
        createReactQueryClientGenerator({
          schema: createEffectSchemaGenerator({ includeSchemas: true }),
        }),
      ],
    })
  );

  expect(result).toMatchSnapshot();
});

test("additionalProperties - with properties (catchall) - zod", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        ObjectWithCatchall: {
          type: "object",
          properties: {
            name: {
              type: "string",
            },
          },
          required: ["name"],
          additionalProperties: {
            type: "string",
          },
        },
      },
    },
  };

  const result = await Effect.runPromise(
    generate({
      schema,
      generators: [
        createReactQueryClientGenerator({
          schema: createZodSchemaGenerator({ includeSchemas: true }),
        }),
      ],
    })
  );

  expect(result).toMatchSnapshot();
});

test("additionalProperties - with properties (catchall) - effect", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        ObjectWithCatchall: {
          type: "object",
          properties: {
            name: {
              type: "string",
            },
          },
          required: ["name"],
          additionalProperties: {
            type: "string",
          },
        },
      },
    },
  };

  const result = await Effect.runPromise(
    generate({
      schema,
      generators: [
        createReactQueryClientGenerator({
          schema: createEffectSchemaGenerator({ includeSchemas: true }),
        }),
      ],
    })
  );

  expect(result).toMatchSnapshot();
});

test("additionalProperties - no additionalProperties - zod", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        SimpleObject: {
          type: "object",
          properties: {
            name: {
              type: "string",
            },
          },
          required: ["name"],
        },
      },
    },
  };

  const result = await Effect.runPromise(
    generate({
      schema,
      generators: [
        createReactQueryClientGenerator({
          schema: createZodSchemaGenerator({ includeSchemas: true }),
        }),
      ],
    })
  );

  expect(result).toMatchSnapshot();
});

test("additionalProperties - additionalProperties true (any value) - zod", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        AnyValueRecord: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
  };

  const result = await Effect.runPromise(
    generate({
      schema,
      generators: [
        createReactQueryClientGenerator({
          schema: createZodSchemaGenerator({ includeSchemas: true }),
        }),
      ],
    })
  );

  expect(result).toMatchSnapshot();
});

test("additionalProperties - additionalProperties true with properties - zod", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        ObjectWithAnyCatchall: {
          type: "object",
          properties: {
            id: {
              type: "number",
            },
          },
          required: ["id"],
          additionalProperties: true,
        },
      },
    },
  };

  const result = await Effect.runPromise(
    generate({
      schema,
      generators: [
        createReactQueryClientGenerator({
          schema: createZodSchemaGenerator({ includeSchemas: true }),
        }),
      ],
    })
  );

  expect(result).toMatchSnapshot();
});

test("additionalProperties - additionalProperties false - zod", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        StrictObject: {
          type: "object",
          properties: {
            name: {
              type: "string",
            },
          },
          required: ["name"],
          additionalProperties: false,
        },
      },
    },
  };

  const result = await Effect.runPromise(
    generate({
      schema,
      generators: [
        createReactQueryClientGenerator({
          schema: createZodSchemaGenerator({ includeSchemas: true }),
        }),
      ],
    })
  );

  expect(result).toMatchSnapshot();
});
