import { test, expect } from "vitest";

import { generate } from "../src/index.js";
import { Effect } from "effect";
import { createReactQueryClientGenerator } from "../src/generators/client.js";
import { createEffectSchemaGenerator } from "../src/generators/effect.js";
import { createZodSchemaGenerator } from "../src/generators/zod.js";

test("x-sohcah-brand - branded string - zod", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        UserId: {
          type: "string",
          "x-sohcah-brand": {
            name: "UserId",
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

test("x-sohcah-brand - branded string - effect", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        UserId: {
          type: "string",
          "x-sohcah-brand": {
            name: "UserId",
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

test("x-sohcah-brand - branded number - zod", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        Price: {
          type: "number",
          "x-sohcah-brand": {
            name: "Price",
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

test("x-sohcah-brand - branded integer - zod", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        Count: {
          type: "integer",
          "x-sohcah-brand": {
            name: "Count",
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

test("x-sohcah-brand - branded boolean - zod", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        Verified: {
          type: "boolean",
          "x-sohcah-brand": {
            name: "Verified",
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

test("x-sohcah-brand - branded string with pattern - zod", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        Email: {
          type: "string",
          pattern: "^[a-z]+@[a-z]+\\.[a-z]+$",
          "x-sohcah-brand": {
            name: "Email",
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

test("x-sohcah-brand - branded schema referenced in object - zod", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        UserId: {
          type: "string",
          "x-sohcah-brand": {
            name: "UserId",
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              $ref: "#/components/schemas/UserId",
            },
            name: {
              type: "string",
            },
          },
          required: ["id", "name"],
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

test("x-sohcah-brand - primitive without brand (no regression) - zod", async () => {
  const schema = {
    openapi: "3.2.0",
    info: { title: "Test", version: "1.0.0" },
    components: {
      schemas: {
        PlainString: {
          type: "string",
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
