// Test: infinite queries > "infinite-query" tag also flips a mutation-style method into a query
//
// Spec:
// paths:
//   /search:
//     post:
//       operationId: search
//       tags:
//         - infinite-query
//       requestBody:
//         content:
//           application/json:
//             schema:
//               type: object
//               properties:
//                 cursor:
//                   type: string
//       responses:
//         "200":
//           description: OK
//           content:
//             application/json:
//               schema:
//                 type: object

import { type QueryClient, type SkipToken, queryOptions, type QueryKey, skipToken, infiniteQueryOptions } from "@tanstack/react-query";
import type { z } from "zod";
import type { Search_Parameters, Search_Response } from "./schemas.ts";
import type { FetchApi } from "./fetch.ts";
import { getApiResult, getUnexpectedResult } from "@sohcah/openapi-generator/react-query/std-runtime";
type QuerySuccess<T extends {
  code: number;
  contentType?: string;
  response: unknown;
}> = Extract<ReturnType<typeof getApiResult<T>> | ReturnType<typeof getUnexpectedResult>, {
  type: "success";
}>["data"];
type QueryError<T extends {
  code: number;
  contentType?: string;
  response: unknown;
}> = Extract<ReturnType<typeof getApiResult<T>> | ReturnType<typeof getUnexpectedResult>, {
  type: "error";
}>["error"];
export class Api {
  constructor(api: FetchApi, queryClient: QueryClient) {
    this.#api = api;
    this.#queryClient = queryClient;
  }
  #api;
  #queryClient;
  async search(parameters: z.output<typeof Search_Parameters>) {
    const result = await this.#api.search(parameters).then(getApiResult, getUnexpectedResult);
    if (result.type === "success") return result.data;
    throw result.error;
  }
  searchQuery(parameters: z.output<typeof Search_Parameters> | SkipToken) {
    return queryOptions<QuerySuccess<z.output<typeof Search_Response>>, QueryError<z.output<typeof Search_Response>>, QuerySuccess<z.output<typeof Search_Response>>, QueryKey>({
      queryKey: ["Search", parameters] as QueryKey,
      queryFn: parameters === skipToken ? skipToken : async () => await this.search(parameters)
    });
  }
  searchInfiniteQuery<TPageParam>(options: {
    getParameters: ((pageParam: TPageParam) => z.output<typeof Search_Parameters>) | SkipToken;
    initialPageParam: TPageParam;
    getNextPageParam: (lastPage: QuerySuccess<z.output<typeof Search_Response>>, allPages: QuerySuccess<z.output<typeof Search_Response>>[], lastPageParam: TPageParam, allPageParams: TPageParam[]) => TPageParam | undefined | null;
    getPreviousPageParam?: (firstPage: QuerySuccess<z.output<typeof Search_Response>>, allPages: QuerySuccess<z.output<typeof Search_Response>>[], firstPageParam: TPageParam, allPageParams: TPageParam[]) => TPageParam | undefined | null;
    maxPages?: number;
  }) {
    const getParameters = options.getParameters;
    return infiniteQueryOptions({
      queryKey: ["Search", getParameters === skipToken ? skipToken : getParameters(options.initialPageParam), "infinite"] as QueryKey,
      queryFn: getParameters === skipToken ? skipToken : async ctx => this.search(getParameters(ctx.pageParam as TPageParam)),
      initialPageParam: options.initialPageParam,
      getNextPageParam: options.getNextPageParam,
      getPreviousPageParam: options.getPreviousPageParam,
      maxPages: options.maxPages
    });
  }
  get invalidate() {
    return new ApiInvalidator(this.#queryClient);
  }
}
class ApiInvalidator {
  #queryClient: QueryClient;
  constructor(queryClient: QueryClient) {
    this.#queryClient = queryClient;
  }
  async search(parameters?: Partial<z.output<typeof Search_Parameters>>) {
    return await this.#queryClient.invalidateQueries({
      queryKey: ["Search", ...(parameters ? [parameters] : [])]
    });
  }
}