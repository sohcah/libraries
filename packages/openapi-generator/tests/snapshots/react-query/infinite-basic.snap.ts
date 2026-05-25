// Test: infinite queries > basic infinite query coexists alongside the regular query
//
// Spec:
// paths:
//   /users:
//     get:
//       operationId: listUsers
//       parameters:
//         - name: cursor
//           in: query
//           schema:
//             type: string
//       responses:
//         "200":
//           description: OK
//           content:
//             application/json:
//               schema:
//                 type: object
//                 properties:
//                   items:
//                     type: array
//                     items:
//                       type: object
//                   nextCursor:
//                     type: string
//                 required:
//                   - items

import { type QueryClient, type SkipToken, queryOptions, type QueryKey, skipToken, infiniteQueryOptions } from "@tanstack/react-query";
import type { z } from "zod";
import type { ListUsers_Parameters, ListUsers_Response } from "./schemas.ts";
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
  async listUsers(parameters: z.output<typeof ListUsers_Parameters>) {
    const result = await this.#api.listUsers(parameters).then(getApiResult, getUnexpectedResult);
    if (result.type === "success") return result.data;
    throw result.error;
  }
  listUsersQuery(parameters: z.output<typeof ListUsers_Parameters> | SkipToken) {
    return queryOptions<QuerySuccess<z.output<typeof ListUsers_Response>>, QueryError<z.output<typeof ListUsers_Response>>, QuerySuccess<z.output<typeof ListUsers_Response>>, QueryKey>({
      queryKey: ["ListUsers", parameters] as QueryKey,
      queryFn: parameters === skipToken ? skipToken : async () => await this.listUsers(parameters)
    });
  }
  listUsersInfiniteQuery<TPageParam>(options: {
    getParameters: ((pageParam: TPageParam) => z.output<typeof ListUsers_Parameters>) | SkipToken;
    initialPageParam: TPageParam;
    getNextPageParam: (lastPage: QuerySuccess<z.output<typeof ListUsers_Response>>, allPages: QuerySuccess<z.output<typeof ListUsers_Response>>[], lastPageParam: TPageParam, allPageParams: TPageParam[]) => TPageParam | undefined | null;
    getPreviousPageParam?: (firstPage: QuerySuccess<z.output<typeof ListUsers_Response>>, allPages: QuerySuccess<z.output<typeof ListUsers_Response>>[], firstPageParam: TPageParam, allPageParams: TPageParam[]) => TPageParam | undefined | null;
    maxPages?: number;
  }) {
    const getParameters = options.getParameters;
    return infiniteQueryOptions({
      queryKey: ["ListUsers", getParameters === skipToken ? skipToken : getParameters(options.initialPageParam), "infinite"] as QueryKey,
      queryFn: getParameters === skipToken ? skipToken : async ctx => this.listUsers(getParameters(ctx.pageParam as TPageParam)),
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
  async listUsers(parameters?: Partial<z.output<typeof ListUsers_Parameters>>) {
    return await this.#queryClient.invalidateQueries({
      queryKey: ["ListUsers", ...(parameters ? [parameters] : [])]
    });
  }
}