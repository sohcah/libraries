import { z } from "zod";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
export class Api {
  #makeRequest;
  constructor(makeRequest: <TParams, TResponse>(options: {
    method: string;
    path: string;
    parametersSchema: z.Schema<TParams, {
      query?: URLSearchParams;
      body?: string | Blob;
      headers?: Headers;
      path?: Record<string, string>;
    }>;
    parameters: TParams;
    responseSchema?: z.Schema<TResponse, string>;
  }) => Promise<TResponse>) {
    this.#makeRequest = makeRequest;
  }
  /**
  ### Add a new pet to the store.
  Add a new pet to the store.
  **/
  async addPet(parameters: z.output<typeof AddPet_Parameters>) {
    return await this.#makeRequest({
      method: "post",
      path: "/pet",
      parametersSchema: AddPet_Parameters,
      parameters: parameters,
      responseSchema: AddPet_Response
    });
  }
  /**
  ### Add a new pet to the store.
  Add a new pet to the store.
  **/
  addPetMutation() {
    return mutationOptions({
      mutationFn: async (parameters: z.output<typeof AddPet_Parameters>) => this.addPet(parameters)
    });
  }
  /**
  ### Update an existing pet
  Update an existing pet by Id.
  **/
  async updatePet(parameters: z.output<typeof UpdatePet_Parameters>) {
    return await this.#makeRequest({
      method: "put",
      path: "/pet",
      parametersSchema: UpdatePet_Parameters,
      parameters: parameters,
      responseSchema: UpdatePet_Response
    });
  }
  /**
  ### Update an existing pet
  Update an existing pet by Id.
  **/
  updatePetMutation() {
    return mutationOptions({
      mutationFn: async (parameters: z.output<typeof UpdatePet_Parameters>) => this.updatePet(parameters)
    });
  }
  /**
  ### Finds Pets by status.
  Multiple status values can be provided with comma separated strings.
  **/
  async findPetsByStatus(parameters: z.output<typeof FindPetsByStatus_Parameters>) {
    return await this.#makeRequest({
      method: "get",
      path: "/pet/findByStatus",
      parametersSchema: FindPetsByStatus_Parameters,
      parameters: parameters,
      responseSchema: FindPetsByStatus_Response
    });
  }
  /**
  ### Finds Pets by status.
  Multiple status values can be provided with comma separated strings.
  **/
  findPetsByStatusQuery(parameters: z.output<typeof FindPetsByStatus_Parameters>) {
    return queryOptions({
      queryKey: ["FindPetsByStatus", parameters],
      queryFn: async () => this.findPetsByStatus(parameters)
    });
  }
  /**
  ### Finds Pets by tags.
  Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
  **/
  async findPetsByTags(parameters: z.output<typeof FindPetsByTags_Parameters>) {
    return await this.#makeRequest({
      method: "get",
      path: "/pet/findByTags",
      parametersSchema: FindPetsByTags_Parameters,
      parameters: parameters,
      responseSchema: FindPetsByTags_Response
    });
  }
  /**
  ### Finds Pets by tags.
  Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
  **/
  findPetsByTagsQuery(parameters: z.output<typeof FindPetsByTags_Parameters>) {
    return queryOptions({
      queryKey: ["FindPetsByTags", parameters],
      queryFn: async () => this.findPetsByTags(parameters)
    });
  }
  /**
  ### Find pet by ID.
  Returns a single pet.
  **/
  async getPetById(parameters: z.output<typeof GetPetById_Parameters>) {
    return await this.#makeRequest({
      method: "get",
      path: "/pet/{petId}",
      parametersSchema: GetPetById_Parameters,
      parameters: parameters,
      responseSchema: GetPetById_Response
    });
  }
  /**
  ### Find pet by ID.
  Returns a single pet.
  **/
  getPetByIdQuery(parameters: z.output<typeof GetPetById_Parameters>) {
    return queryOptions({
      queryKey: ["GetPetById", parameters],
      queryFn: async () => this.getPetById(parameters)
    });
  }
  /**
  ### Updates a pet in the store with form data.
  Updates a pet resource based on the form data.
  **/
  async updatePetWithForm(parameters: z.output<typeof UpdatePetWithForm_Parameters>) {
    return await this.#makeRequest({
      method: "post",
      path: "/pet/{petId}",
      parametersSchema: UpdatePetWithForm_Parameters,
      parameters: parameters,
      responseSchema: UpdatePetWithForm_Response
    });
  }
  /**
  ### Updates a pet in the store with form data.
  Updates a pet resource based on the form data.
  **/
  updatePetWithFormMutation() {
    return mutationOptions({
      mutationFn: async (parameters: z.output<typeof UpdatePetWithForm_Parameters>) => this.updatePetWithForm(parameters)
    });
  }
  /**
  ### Deletes a pet.
  Delete a pet.
  **/
  async deletePet(parameters: z.output<typeof DeletePet_Parameters>) {
    return await this.#makeRequest({
      method: "delete",
      path: "/pet/{petId}",
      parametersSchema: DeletePet_Parameters,
      parameters: parameters
    });
  }
  /**
  ### Deletes a pet.
  Delete a pet.
  **/
  deletePetMutation() {
    return mutationOptions({
      mutationFn: async (parameters: z.output<typeof DeletePet_Parameters>) => this.deletePet(parameters)
    });
  }
  /**
  ### Uploads an image.
  Upload image of the pet.
  **/
  async uploadFile(parameters: z.output<typeof UploadFile_Parameters>) {
    return await this.#makeRequest({
      method: "post",
      path: "/pet/{petId}/uploadImage",
      parametersSchema: UploadFile_Parameters,
      parameters: parameters,
      responseSchema: UploadFile_Response
    });
  }
  /**
  ### Uploads an image.
  Upload image of the pet.
  **/
  uploadFileMutation() {
    return mutationOptions({
      mutationFn: async (parameters: z.output<typeof UploadFile_Parameters>) => this.uploadFile(parameters)
    });
  }
  /**
  ### Returns pet inventories by status.
  Returns a map of status codes to quantities.
  **/
  async getInventory(parameters: z.output<typeof GetInventory_Parameters>) {
    return await this.#makeRequest({
      method: "get",
      path: "/store/inventory",
      parametersSchema: GetInventory_Parameters,
      parameters: parameters,
      responseSchema: GetInventory_Response
    });
  }
  /**
  ### Returns pet inventories by status.
  Returns a map of status codes to quantities.
  **/
  getInventoryQuery(parameters: z.output<typeof GetInventory_Parameters>) {
    return queryOptions({
      queryKey: ["GetInventory", parameters],
      queryFn: async () => this.getInventory(parameters)
    });
  }
  /**
  ### Place an order for a pet.
  Place a new order in the store.
  **/
  async placeOrder(parameters: z.output<typeof PlaceOrder_Parameters>) {
    return await this.#makeRequest({
      method: "post",
      path: "/store/order",
      parametersSchema: PlaceOrder_Parameters,
      parameters: parameters,
      responseSchema: PlaceOrder_Response
    });
  }
  /**
  ### Place an order for a pet.
  Place a new order in the store.
  **/
  placeOrderMutation() {
    return mutationOptions({
      mutationFn: async (parameters: z.output<typeof PlaceOrder_Parameters>) => this.placeOrder(parameters)
    });
  }
  /**
  ### Find purchase order by ID.
  For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
  **/
  async getOrderById(parameters: z.output<typeof GetOrderById_Parameters>) {
    return await this.#makeRequest({
      method: "get",
      path: "/store/order/{orderId}",
      parametersSchema: GetOrderById_Parameters,
      parameters: parameters,
      responseSchema: GetOrderById_Response
    });
  }
  /**
  ### Find purchase order by ID.
  For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
  **/
  getOrderByIdQuery(parameters: z.output<typeof GetOrderById_Parameters>) {
    return queryOptions({
      queryKey: ["GetOrderById", parameters],
      queryFn: async () => this.getOrderById(parameters)
    });
  }
  /**
  ### Delete purchase order by identifier.
  For valid response try integer IDs with value < 1000. Anything above 1000 or non-integers will generate API errors.
  **/
  async deleteOrder(parameters: z.output<typeof DeleteOrder_Parameters>) {
    return await this.#makeRequest({
      method: "delete",
      path: "/store/order/{orderId}",
      parametersSchema: DeleteOrder_Parameters,
      parameters: parameters
    });
  }
  /**
  ### Delete purchase order by identifier.
  For valid response try integer IDs with value < 1000. Anything above 1000 or non-integers will generate API errors.
  **/
  deleteOrderMutation() {
    return mutationOptions({
      mutationFn: async (parameters: z.output<typeof DeleteOrder_Parameters>) => this.deleteOrder(parameters)
    });
  }
  /**
  ### Create user.
  This can only be done by the logged in user.
  **/
  async createUser(parameters: z.output<typeof CreateUser_Parameters>) {
    return await this.#makeRequest({
      method: "post",
      path: "/user",
      parametersSchema: CreateUser_Parameters,
      parameters: parameters,
      responseSchema: CreateUser_Response
    });
  }
  /**
  ### Create user.
  This can only be done by the logged in user.
  **/
  createUserMutation() {
    return mutationOptions({
      mutationFn: async (parameters: z.output<typeof CreateUser_Parameters>) => this.createUser(parameters)
    });
  }
  /**
  ### Creates list of users with given input array.
  Creates list of users with given input array.
  **/
  async createUsersWithListInput(parameters: z.output<typeof CreateUsersWithListInput_Parameters>) {
    return await this.#makeRequest({
      method: "post",
      path: "/user/createWithList",
      parametersSchema: CreateUsersWithListInput_Parameters,
      parameters: parameters,
      responseSchema: CreateUsersWithListInput_Response
    });
  }
  /**
  ### Creates list of users with given input array.
  Creates list of users with given input array.
  **/
  createUsersWithListInputMutation() {
    return mutationOptions({
      mutationFn: async (parameters: z.output<typeof CreateUsersWithListInput_Parameters>) => this.createUsersWithListInput(parameters)
    });
  }
  /**
  ### Logs user into the system.
  Log into the system.
  **/
  async loginUser(parameters: z.output<typeof LoginUser_Parameters>) {
    return await this.#makeRequest({
      method: "get",
      path: "/user/login",
      parametersSchema: LoginUser_Parameters,
      parameters: parameters,
      responseSchema: LoginUser_Response
    });
  }
  /**
  ### Logs user into the system.
  Log into the system.
  **/
  loginUserQuery(parameters: z.output<typeof LoginUser_Parameters>) {
    return queryOptions({
      queryKey: ["LoginUser", parameters],
      queryFn: async () => this.loginUser(parameters)
    });
  }
  /**
  ### Logs out current logged in user session.
  Log user out of the system.
  **/
  async logoutUser(parameters: z.output<typeof LogoutUser_Parameters>) {
    return await this.#makeRequest({
      method: "get",
      path: "/user/logout",
      parametersSchema: LogoutUser_Parameters,
      parameters: parameters
    });
  }
  /**
  ### Logs out current logged in user session.
  Log user out of the system.
  **/
  logoutUserQuery(parameters: z.output<typeof LogoutUser_Parameters>) {
    return queryOptions({
      queryKey: ["LogoutUser", parameters],
      queryFn: async () => this.logoutUser(parameters)
    });
  }
  /**
  ### Get user by user name.
  Get user detail based on username.
  **/
  async getUserByName(parameters: z.output<typeof GetUserByName_Parameters>) {
    return await this.#makeRequest({
      method: "get",
      path: "/user/{username}",
      parametersSchema: GetUserByName_Parameters,
      parameters: parameters,
      responseSchema: GetUserByName_Response
    });
  }
  /**
  ### Get user by user name.
  Get user detail based on username.
  **/
  getUserByNameQuery(parameters: z.output<typeof GetUserByName_Parameters>) {
    return queryOptions({
      queryKey: ["GetUserByName", parameters],
      queryFn: async () => this.getUserByName(parameters)
    });
  }
  /**
  ### Update user resource.
  This can only be done by the logged in user.
  **/
  async updateUser(parameters: z.output<typeof UpdateUser_Parameters>) {
    return await this.#makeRequest({
      method: "put",
      path: "/user/{username}",
      parametersSchema: UpdateUser_Parameters,
      parameters: parameters
    });
  }
  /**
  ### Update user resource.
  This can only be done by the logged in user.
  **/
  updateUserMutation() {
    return mutationOptions({
      mutationFn: async (parameters: z.output<typeof UpdateUser_Parameters>) => this.updateUser(parameters)
    });
  }
  /**
  ### Delete user resource.
  This can only be done by the logged in user.
  **/
  async deleteUser(parameters: z.output<typeof DeleteUser_Parameters>) {
    return await this.#makeRequest({
      method: "delete",
      path: "/user/{username}",
      parametersSchema: DeleteUser_Parameters,
      parameters: parameters
    });
  }
  /**
  ### Delete user resource.
  This can only be done by the logged in user.
  **/
  deleteUserMutation() {
    return mutationOptions({
      mutationFn: async (parameters: z.output<typeof DeleteUser_Parameters>) => this.deleteUser(parameters)
    });
  }
}
export const Category = z.object({
  id: z.int().optional(),
  name: z.string().optional()
});
export type Category = z.output<typeof Category>;
export const Tag = z.object({
  id: z.int().optional(),
  name: z.string().optional()
});
export type Tag = z.output<typeof Tag>;
export const Pet = z.object({
  id: z.int().optional(),
  name: z.string(),
  category: Category.optional(),
  photoUrls: z.array(z.string()),
  tags: z.array(Tag).optional(),
  /** pet status in the store*/status: z.enum(["available", "pending", "sold"]).optional()
});
export type Pet = z.output<typeof Pet>;
export const ParametersSchema = z.object({
  query: z.instanceof(URLSearchParams).optional(),
  headers: z.instanceof(Headers).optional(),
  path: z.record(z.string(), z.string()).optional(),
  body: z.union([z.string(), z.instanceof(Blob)]).optional()
});
export const AddPet_Parameters = z.codec(ParametersSchema, z.object({
  data: z.codec(z.string(), Pet, {
    decode: (from, ctx) => {
      try {
        return JSON.parse(from);
      } catch (error: unknown) {
        ctx.issues.push({
          code: "custom",
          input: from,
          message: (error as Error).message
        });
        return z.NEVER;
      }
    },
    encode: (from, ctx) => JSON.stringify(from)
  })
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    body: from.data
  })
});
export const AddPet_Response = z.codec(z.string(), Pet, {
  decode: (from, ctx) => {
    try {
      return JSON.parse(from);
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: from,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: (from, ctx) => JSON.stringify(from)
});
export const UpdatePet_Parameters = z.codec(ParametersSchema, z.object({
  data: z.codec(z.string(), Pet, {
    decode: (from, ctx) => {
      try {
        return JSON.parse(from);
      } catch (error: unknown) {
        ctx.issues.push({
          code: "custom",
          input: from,
          message: (error as Error).message
        });
        return z.NEVER;
      }
    },
    encode: (from, ctx) => JSON.stringify(from)
  })
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    body: from.data
  })
});
export const UpdatePet_Response = z.codec(z.string(), Pet, {
  decode: (from, ctx) => {
    try {
      return JSON.parse(from);
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: from,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: (from, ctx) => JSON.stringify(from)
});
export const FindPetsByStatus_Parameters = z.codec(ParametersSchema, z.object({
  /** Status values that need to be considered for filter*/status: z.enum(["available", "pending", "sold"]).optional()
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    query: new URLSearchParams([["status", String(from.status)]])
  })
});
export const FindPetsByStatus_Response = z.codec(z.string(), z.array(Pet), {
  decode: (from, ctx) => {
    try {
      return JSON.parse(from);
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: from,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: (from, ctx) => JSON.stringify(from)
});
export const FindPetsByTags_Parameters = z.codec(ParametersSchema, z.object({
  /** Tags to filter by*/tags: z.array(z.string()).optional()
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    query: new URLSearchParams([...(from.tags?.map<[string, string]>(value => ["tags", String(value)]) ?? [])])
  })
});
export const FindPetsByTags_Response = z.codec(z.string(), z.array(Pet), {
  decode: (from, ctx) => {
    try {
      return JSON.parse(from);
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: from,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: (from, ctx) => JSON.stringify(from)
});
export const GetPetById_Parameters = z.codec(ParametersSchema, z.object({
  /** ID of pet to return*/petId: z.int()
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    path: {
      petId: String(from.petId)
    }
  })
});
export const GetPetById_Response = z.codec(z.string(), Pet, {
  decode: (from, ctx) => {
    try {
      return JSON.parse(from);
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: from,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: (from, ctx) => JSON.stringify(from)
});
export const UpdatePetWithForm_Parameters = z.codec(ParametersSchema, z.object({
  /** ID of pet that needs to be updated*/petId: z.int(),
  /** Name of pet that needs to be updated*/name: z.string().optional(),
  /** Status of pet that needs to be updated*/status: z.string().optional()
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    query: new URLSearchParams([["name", String(from.name)], ["status", String(from.status)]]),
    path: {
      petId: String(from.petId)
    }
  })
});
export const UpdatePetWithForm_Response = z.codec(z.string(), Pet, {
  decode: (from, ctx) => {
    try {
      return JSON.parse(from);
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: from,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: (from, ctx) => JSON.stringify(from)
});
export const DeletePet_Parameters = z.codec(ParametersSchema, z.object({
  api_key: z.string().optional(),
  /** Pet id to delete*/petId: z.int()
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    path: {
      petId: String(from.petId)
    },
    header: new Headers([["api_key", String(from.api_key)]])
  })
});
export const UploadFile_Parameters = z.codec(ParametersSchema, z.object({
  /** ID of pet to update*/petId: z.int(),
  /** Additional Metadata*/additionalMetadata: z.string().optional(),
  data: z.instanceof(Blob)
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    query: new URLSearchParams([["additionalMetadata", String(from.additionalMetadata)]]),
    path: {
      petId: String(from.petId)
    },
    body: from.data
  })
});
export const ApiResponse = z.object({
  code: z.int().optional(),
  type: z.string().optional(),
  message: z.string().optional()
});
export type ApiResponse = z.output<typeof ApiResponse>;
export const UploadFile_Response = z.codec(z.string(), ApiResponse, {
  decode: (from, ctx) => {
    try {
      return JSON.parse(from);
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: from,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: (from, ctx) => JSON.stringify(from)
});
export const GetInventory_Parameters = z.codec(ParametersSchema, z.object({}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({})
});
export const GetInventory_Response = z.codec(z.string(), z.object({}), {
  decode: (from, ctx) => {
    try {
      return JSON.parse(from);
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: from,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: (from, ctx) => JSON.stringify(from)
});
export const Order = z.object({
  id: z.int().optional(),
  petId: z.int().optional(),
  quantity: z.int().optional(),
  shipDate: z.string().optional(),
  /** Order Status*/status: z.enum(["placed", "approved", "delivered"]).optional(),
  complete: z.boolean().optional()
});
export type Order = z.output<typeof Order>;
export const PlaceOrder_Parameters = z.codec(ParametersSchema, z.object({
  data: z.codec(z.string(), Order, {
    decode: (from, ctx) => {
      try {
        return JSON.parse(from);
      } catch (error: unknown) {
        ctx.issues.push({
          code: "custom",
          input: from,
          message: (error as Error).message
        });
        return z.NEVER;
      }
    },
    encode: (from, ctx) => JSON.stringify(from)
  })
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    body: from.data
  })
});
export const PlaceOrder_Response = z.codec(z.string(), Order, {
  decode: (from, ctx) => {
    try {
      return JSON.parse(from);
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: from,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: (from, ctx) => JSON.stringify(from)
});
export const GetOrderById_Parameters = z.codec(ParametersSchema, z.object({
  /** ID of order that needs to be fetched*/orderId: z.int()
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    path: {
      orderId: String(from.orderId)
    }
  })
});
export const GetOrderById_Response = z.codec(z.string(), Order, {
  decode: (from, ctx) => {
    try {
      return JSON.parse(from);
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: from,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: (from, ctx) => JSON.stringify(from)
});
export const DeleteOrder_Parameters = z.codec(ParametersSchema, z.object({
  /** ID of the order that needs to be deleted*/orderId: z.int()
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    path: {
      orderId: String(from.orderId)
    }
  })
});
export const User = z.object({
  id: z.int().optional(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  /** User Status*/userStatus: z.int().optional()
});
export type User = z.output<typeof User>;
export const CreateUser_Parameters = z.codec(ParametersSchema, z.object({
  data: z.codec(z.string(), User, {
    decode: (from, ctx) => {
      try {
        return JSON.parse(from);
      } catch (error: unknown) {
        ctx.issues.push({
          code: "custom",
          input: from,
          message: (error as Error).message
        });
        return z.NEVER;
      }
    },
    encode: (from, ctx) => JSON.stringify(from)
  })
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    body: from.data
  })
});
export const CreateUser_Response = z.codec(z.string(), User, {
  decode: (from, ctx) => {
    try {
      return JSON.parse(from);
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: from,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: (from, ctx) => JSON.stringify(from)
});
export const CreateUsersWithListInput_Parameters = z.codec(ParametersSchema, z.object({
  data: z.codec(z.string(), z.array(User), {
    decode: (from, ctx) => {
      try {
        return JSON.parse(from);
      } catch (error: unknown) {
        ctx.issues.push({
          code: "custom",
          input: from,
          message: (error as Error).message
        });
        return z.NEVER;
      }
    },
    encode: (from, ctx) => JSON.stringify(from)
  })
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    body: from.data
  })
});
export const CreateUsersWithListInput_Response = z.codec(z.string(), User, {
  decode: (from, ctx) => {
    try {
      return JSON.parse(from);
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: from,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: (from, ctx) => JSON.stringify(from)
});
export const LoginUser_Parameters = z.codec(ParametersSchema, z.object({
  /** The user name for login*/username: z.string().optional(),
  /** The password for login in clear text*/password: z.string().optional()
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    query: new URLSearchParams([["username", String(from.username)], ["password", String(from.password)]])
  })
});
export const LoginUser_Response = z.codec(z.string(), z.string(), {
  decode: (from, ctx) => {
    try {
      return JSON.parse(from);
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: from,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: (from, ctx) => JSON.stringify(from)
});
export const LogoutUser_Parameters = z.codec(ParametersSchema, z.object({}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({})
});
export const GetUserByName_Parameters = z.codec(ParametersSchema, z.object({
  /** The name that needs to be fetched. Use user1 for testing*/username: z.string()
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    path: {
      username: String(from.username)
    }
  })
});
export const GetUserByName_Response = z.codec(z.string(), User, {
  decode: (from, ctx) => {
    try {
      return JSON.parse(from);
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: from,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: (from, ctx) => JSON.stringify(from)
});
export const UpdateUser_Parameters = z.codec(ParametersSchema, z.object({
  /** name that need to be deleted*/username: z.string(),
  data: z.codec(z.string(), User, {
    decode: (from, ctx) => {
      try {
        return JSON.parse(from);
      } catch (error: unknown) {
        ctx.issues.push({
          code: "custom",
          input: from,
          message: (error as Error).message
        });
        return z.NEVER;
      }
    },
    encode: (from, ctx) => JSON.stringify(from)
  })
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    path: {
      username: String(from.username)
    },
    body: from.data
  })
});
export const DeleteUser_Parameters = z.codec(ParametersSchema, z.object({
  /** The name that needs to be deleted*/username: z.string()
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    path: {
      username: String(from.username)
    }
  })
});