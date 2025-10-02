import * as Schema from "effect/Schema";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
export class Api {
  #makeRequest;
  constructor(makeRequest: <TParams, TResponse>(options: {
    method: string;
    path: string;
    parametersSchema: Schema.Schema<TParams, {
      query?: URLSearchParams;
      body?: string | Blob;
      headers?: Headers;
      path?: Record<string, string>;
    }>;
    parameters: TParams;
    responseSchema?: Schema.Schema<TResponse, string>;
  }) => Promise<TResponse>) {
    this.#makeRequest = makeRequest;
  }
  /**
  ### Add a new pet to the store.
  Add a new pet to the store.
  **/
  async addPet(parameters: Schema.Schema.Type<typeof AddPet_Parameters>) {
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
      mutationFn: async (parameters: Schema.Schema.Type<typeof AddPet_Parameters>) => this.addPet(parameters)
    });
  }
  /**
  ### Update an existing pet
  Update an existing pet by Id.
  **/
  async updatePet(parameters: Schema.Schema.Type<typeof UpdatePet_Parameters>) {
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
      mutationFn: async (parameters: Schema.Schema.Type<typeof UpdatePet_Parameters>) => this.updatePet(parameters)
    });
  }
  /**
  ### Finds Pets by status.
  Multiple status values can be provided with comma separated strings.
  **/
  async findPetsByStatus(parameters: Schema.Schema.Type<typeof FindPetsByStatus_Parameters>) {
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
  findPetsByStatusQuery(parameters: Schema.Schema.Type<typeof FindPetsByStatus_Parameters>) {
    return queryOptions({
      queryKey: ["FindPetsByStatus", parameters],
      queryFn: async () => this.findPetsByStatus(parameters)
    });
  }
  /**
  ### Finds Pets by tags.
  Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
  **/
  async findPetsByTags(parameters: Schema.Schema.Type<typeof FindPetsByTags_Parameters>) {
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
  findPetsByTagsQuery(parameters: Schema.Schema.Type<typeof FindPetsByTags_Parameters>) {
    return queryOptions({
      queryKey: ["FindPetsByTags", parameters],
      queryFn: async () => this.findPetsByTags(parameters)
    });
  }
  /**
  ### Find pet by ID.
  Returns a single pet.
  **/
  async getPetById(parameters: Schema.Schema.Type<typeof GetPetById_Parameters>) {
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
  getPetByIdQuery(parameters: Schema.Schema.Type<typeof GetPetById_Parameters>) {
    return queryOptions({
      queryKey: ["GetPetById", parameters],
      queryFn: async () => this.getPetById(parameters)
    });
  }
  /**
  ### Updates a pet in the store with form data.
  Updates a pet resource based on the form data.
  **/
  async updatePetWithForm(parameters: Schema.Schema.Type<typeof UpdatePetWithForm_Parameters>) {
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
      mutationFn: async (parameters: Schema.Schema.Type<typeof UpdatePetWithForm_Parameters>) => this.updatePetWithForm(parameters)
    });
  }
  /**
  ### Deletes a pet.
  Delete a pet.
  **/
  async deletePet(parameters: Schema.Schema.Type<typeof DeletePet_Parameters>) {
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
      mutationFn: async (parameters: Schema.Schema.Type<typeof DeletePet_Parameters>) => this.deletePet(parameters)
    });
  }
  /**
  ### Uploads an image.
  Upload image of the pet.
  **/
  async uploadFile(parameters: Schema.Schema.Type<typeof UploadFile_Parameters>) {
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
      mutationFn: async (parameters: Schema.Schema.Type<typeof UploadFile_Parameters>) => this.uploadFile(parameters)
    });
  }
  /**
  ### Returns pet inventories by status.
  Returns a map of status codes to quantities.
  **/
  async getInventory(parameters: Schema.Schema.Type<typeof GetInventory_Parameters>) {
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
  getInventoryQuery(parameters: Schema.Schema.Type<typeof GetInventory_Parameters>) {
    return queryOptions({
      queryKey: ["GetInventory", parameters],
      queryFn: async () => this.getInventory(parameters)
    });
  }
  /**
  ### Place an order for a pet.
  Place a new order in the store.
  **/
  async placeOrder(parameters: Schema.Schema.Type<typeof PlaceOrder_Parameters>) {
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
      mutationFn: async (parameters: Schema.Schema.Type<typeof PlaceOrder_Parameters>) => this.placeOrder(parameters)
    });
  }
  /**
  ### Find purchase order by ID.
  For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
  **/
  async getOrderById(parameters: Schema.Schema.Type<typeof GetOrderById_Parameters>) {
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
  getOrderByIdQuery(parameters: Schema.Schema.Type<typeof GetOrderById_Parameters>) {
    return queryOptions({
      queryKey: ["GetOrderById", parameters],
      queryFn: async () => this.getOrderById(parameters)
    });
  }
  /**
  ### Delete purchase order by identifier.
  For valid response try integer IDs with value < 1000. Anything above 1000 or non-integers will generate API errors.
  **/
  async deleteOrder(parameters: Schema.Schema.Type<typeof DeleteOrder_Parameters>) {
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
      mutationFn: async (parameters: Schema.Schema.Type<typeof DeleteOrder_Parameters>) => this.deleteOrder(parameters)
    });
  }
  /**
  ### Create user.
  This can only be done by the logged in user.
  **/
  async createUser(parameters: Schema.Schema.Type<typeof CreateUser_Parameters>) {
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
      mutationFn: async (parameters: Schema.Schema.Type<typeof CreateUser_Parameters>) => this.createUser(parameters)
    });
  }
  /**
  ### Creates list of users with given input array.
  Creates list of users with given input array.
  **/
  async createUsersWithListInput(parameters: Schema.Schema.Type<typeof CreateUsersWithListInput_Parameters>) {
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
      mutationFn: async (parameters: Schema.Schema.Type<typeof CreateUsersWithListInput_Parameters>) => this.createUsersWithListInput(parameters)
    });
  }
  /**
  ### Logs user into the system.
  Log into the system.
  **/
  async loginUser(parameters: Schema.Schema.Type<typeof LoginUser_Parameters>) {
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
  loginUserQuery(parameters: Schema.Schema.Type<typeof LoginUser_Parameters>) {
    return queryOptions({
      queryKey: ["LoginUser", parameters],
      queryFn: async () => this.loginUser(parameters)
    });
  }
  /**
  ### Logs out current logged in user session.
  Log user out of the system.
  **/
  async logoutUser(parameters: Schema.Schema.Type<typeof LogoutUser_Parameters>) {
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
  logoutUserQuery(parameters: Schema.Schema.Type<typeof LogoutUser_Parameters>) {
    return queryOptions({
      queryKey: ["LogoutUser", parameters],
      queryFn: async () => this.logoutUser(parameters)
    });
  }
  /**
  ### Get user by user name.
  Get user detail based on username.
  **/
  async getUserByName(parameters: Schema.Schema.Type<typeof GetUserByName_Parameters>) {
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
  getUserByNameQuery(parameters: Schema.Schema.Type<typeof GetUserByName_Parameters>) {
    return queryOptions({
      queryKey: ["GetUserByName", parameters],
      queryFn: async () => this.getUserByName(parameters)
    });
  }
  /**
  ### Update user resource.
  This can only be done by the logged in user.
  **/
  async updateUser(parameters: Schema.Schema.Type<typeof UpdateUser_Parameters>) {
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
      mutationFn: async (parameters: Schema.Schema.Type<typeof UpdateUser_Parameters>) => this.updateUser(parameters)
    });
  }
  /**
  ### Delete user resource.
  This can only be done by the logged in user.
  **/
  async deleteUser(parameters: Schema.Schema.Type<typeof DeleteUser_Parameters>) {
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
      mutationFn: async (parameters: Schema.Schema.Type<typeof DeleteUser_Parameters>) => this.deleteUser(parameters)
    });
  }
}
export const Category = Schema.Struct({
  id: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable).pipe(Schema.optional),
  name: Schema.String.pipe(Schema.mutable).pipe(Schema.optional)
}).pipe(Schema.mutable);
export type Category = Schema.Schema.Type<typeof Category>;
export const Tag = Schema.Struct({
  id: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable).pipe(Schema.optional),
  name: Schema.String.pipe(Schema.mutable).pipe(Schema.optional)
}).pipe(Schema.mutable);
export type Tag = Schema.Schema.Type<typeof Tag>;
export const Pet = Schema.Struct({
  id: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable).pipe(Schema.optional),
  name: Schema.String.pipe(Schema.mutable),
  category: Category.pipe(Schema.optional),
  photoUrls: Schema.Array(Schema.String.pipe(Schema.mutable)).pipe(Schema.mutable).pipe(Schema.mutable),
  tags: Schema.Array(Tag).pipe(Schema.mutable).pipe(Schema.mutable).pipe(Schema.optional),
  /** pet status in the store*/status: Schema.Literal("available", "pending", "sold").pipe(Schema.mutable).pipe(Schema.optional)
}).pipe(Schema.mutable);
export type Pet = Schema.Schema.Type<typeof Pet>;
export const ParametersSchema = Schema.Struct({
  query: Schema.instanceOf(URLSearchParams).pipe(Schema.optional),
  headers: Schema.instanceOf(Headers).pipe(Schema.optional),
  path: Schema.Record({
    key: Schema.String,
    value: Schema.String
  }).pipe(Schema.optional),
  body: Schema.Union(Schema.String, Schema.instanceOf(Blob)).pipe(Schema.optional)
});
export const AddPet_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  data: Schema.parseJson(Pet)
}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    body: from.data
  })
});
export const AddPet_Response = Schema.parseJson(Pet);
export const UpdatePet_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  data: Schema.parseJson(Pet)
}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    body: from.data
  })
});
export const UpdatePet_Response = Schema.parseJson(Pet);
export const FindPetsByStatus_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  /** Status values that need to be considered for filter*/status: Schema.Literal("available", "pending", "sold").pipe(Schema.mutable).pipe(Schema.optional)
}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    query: new URLSearchParams([["status", String(from.status)]])
  })
});
export const FindPetsByStatus_Response = Schema.parseJson(Schema.Array(Pet).pipe(Schema.mutable).pipe(Schema.mutable));
export const FindPetsByTags_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  /** Tags to filter by*/tags: Schema.Array(Schema.String.pipe(Schema.mutable)).pipe(Schema.mutable).pipe(Schema.mutable).pipe(Schema.optional)
}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    query: new URLSearchParams([...(from.tags?.map<[string, string]>(value => ["tags", String(value)]) ?? [])])
  })
});
export const FindPetsByTags_Response = Schema.parseJson(Schema.Array(Pet).pipe(Schema.mutable).pipe(Schema.mutable));
export const GetPetById_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  /** ID of pet to return*/petId: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable)
}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    path: {
      petId: String(from.petId)
    }
  })
});
export const GetPetById_Response = Schema.parseJson(Pet);
export const UpdatePetWithForm_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  /** ID of pet that needs to be updated*/petId: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable),
  /** Name of pet that needs to be updated*/name: Schema.String.pipe(Schema.mutable).pipe(Schema.optional),
  /** Status of pet that needs to be updated*/status: Schema.String.pipe(Schema.mutable).pipe(Schema.optional)
}), {
  strict: true,
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
export const UpdatePetWithForm_Response = Schema.parseJson(Pet);
export const DeletePet_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  api_key: Schema.String.pipe(Schema.mutable).pipe(Schema.optional),
  /** Pet id to delete*/petId: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable)
}), {
  strict: true,
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
export const UploadFile_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  /** ID of pet to update*/petId: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable),
  /** Additional Metadata*/additionalMetadata: Schema.String.pipe(Schema.mutable).pipe(Schema.optional),
  data: Schema.instanceOf(Blob)
}), {
  strict: true,
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
export const ApiResponse = Schema.Struct({
  code: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable).pipe(Schema.optional),
  type: Schema.String.pipe(Schema.mutable).pipe(Schema.optional),
  message: Schema.String.pipe(Schema.mutable).pipe(Schema.optional)
}).pipe(Schema.mutable);
export type ApiResponse = Schema.Schema.Type<typeof ApiResponse>;
export const UploadFile_Response = Schema.parseJson(ApiResponse);
export const GetInventory_Parameters = Schema.transform(ParametersSchema, Schema.Struct({}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({})
});
export const GetInventory_Response = Schema.parseJson(Schema.Struct({}).pipe(Schema.mutable));
export const Order = Schema.Struct({
  id: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable).pipe(Schema.optional),
  petId: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable).pipe(Schema.optional),
  quantity: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable).pipe(Schema.optional),
  shipDate: Schema.String.pipe(Schema.mutable).pipe(Schema.optional),
  /** Order Status*/status: Schema.Literal("placed", "approved", "delivered").pipe(Schema.mutable).pipe(Schema.optional),
  complete: Schema.Boolean.pipe(Schema.mutable).pipe(Schema.optional)
}).pipe(Schema.mutable);
export type Order = Schema.Schema.Type<typeof Order>;
export const PlaceOrder_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  data: Schema.parseJson(Order)
}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    body: from.data
  })
});
export const PlaceOrder_Response = Schema.parseJson(Order);
export const GetOrderById_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  /** ID of order that needs to be fetched*/orderId: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable)
}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    path: {
      orderId: String(from.orderId)
    }
  })
});
export const GetOrderById_Response = Schema.parseJson(Order);
export const DeleteOrder_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  /** ID of the order that needs to be deleted*/orderId: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable)
}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    path: {
      orderId: String(from.orderId)
    }
  })
});
export const User = Schema.Struct({
  id: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable).pipe(Schema.optional),
  username: Schema.String.pipe(Schema.mutable).pipe(Schema.optional),
  firstName: Schema.String.pipe(Schema.mutable).pipe(Schema.optional),
  lastName: Schema.String.pipe(Schema.mutable).pipe(Schema.optional),
  email: Schema.String.pipe(Schema.mutable).pipe(Schema.optional),
  password: Schema.String.pipe(Schema.mutable).pipe(Schema.optional),
  phone: Schema.String.pipe(Schema.mutable).pipe(Schema.optional),
  /** User Status*/userStatus: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable).pipe(Schema.optional)
}).pipe(Schema.mutable);
export type User = Schema.Schema.Type<typeof User>;
export const CreateUser_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  data: Schema.parseJson(User)
}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    body: from.data
  })
});
export const CreateUser_Response = Schema.parseJson(User);
export const CreateUsersWithListInput_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  data: Schema.parseJson(Schema.Array(User).pipe(Schema.mutable).pipe(Schema.mutable))
}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    body: from.data
  })
});
export const CreateUsersWithListInput_Response = Schema.parseJson(User);
export const LoginUser_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  /** The user name for login*/username: Schema.String.pipe(Schema.mutable).pipe(Schema.optional),
  /** The password for login in clear text*/password: Schema.String.pipe(Schema.mutable).pipe(Schema.optional)
}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    query: new URLSearchParams([["username", String(from.username)], ["password", String(from.password)]])
  })
});
export const LoginUser_Response = Schema.parseJson(Schema.String.pipe(Schema.mutable));
export const LogoutUser_Parameters = Schema.transform(ParametersSchema, Schema.Struct({}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({})
});
export const GetUserByName_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  /** The name that needs to be fetched. Use user1 for testing*/username: Schema.String.pipe(Schema.mutable)
}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    path: {
      username: String(from.username)
    }
  })
});
export const GetUserByName_Response = Schema.parseJson(User);
export const UpdateUser_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  /** name that need to be deleted*/username: Schema.String.pipe(Schema.mutable),
  data: Schema.parseJson(User)
}), {
  strict: true,
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
export const DeleteUser_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  /** The name that needs to be deleted*/username: Schema.String.pipe(Schema.mutable)
}), {
  strict: true,
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    path: {
      username: String(from.username)
    }
  })
});