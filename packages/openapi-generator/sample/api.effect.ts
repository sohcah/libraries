import * as Schema from "effect/Schema";
import { queryOptions, mutationOptions, useQuery, useMutation } from "@tanstack/react-query";
export const ParametersSchema = Schema.Struct({
  query: Schema.instanceOf(URLSearchParams).pipe(Schema.optional),
  headers: Schema.instanceOf(Headers).pipe(Schema.optional),
  path: Schema.Record({
    key: Schema.String,
    value: Schema.String
  }).pipe(Schema.optional),
  body: Schema.Union(Schema.String, Schema.instanceOf(Blob)).pipe(Schema.optional)
});
export async function makeRequest<TParams, TResponse>({
  method,
  path,
  parameterSchema,
  parameters,
  responseSchema
}: {
  method: string;
  path: string;
  parameterSchema: Schema.Schema<TParams, {
    query?: URLSearchParams;
    body?: string | Blob;
  }>;
  parameters: TParams;
  responseSchema?: Schema.Schema<TResponse, string>;
}) {
  const {
    query: query,
    body: body
  } = Schema.encodeSync(parameterSchema)(parameters);
  const url = new URL(path, "http://localhost:3000");
  if (query) {
    url.search = query.toString();
  }
  const response = await fetch(url, {
    method,
    body
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  if (!responseSchema) {
    return null;
  }
  return Schema.decodeSync(responseSchema)(await response.text());
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
    query: new URLSearchParams([["tags", String(from.tags)]])
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
export function useApi() {
  return {
    /**
    ### Add a new pet to the store.
    Add a new pet to the store.
    **/
    addPet: () => mutationOptions({
      mutationFn: async (parameters: Schema.Schema.Type<typeof AddPet_Parameters>) => await makeRequest({
        method: "post",
        path: "/pet",
        parameterSchema: AddPet_Parameters,
        parameters,
        responseSchema: AddPet_Response
      })
    }),
    /**
    ### Update an existing pet
    Update an existing pet by Id.
    **/
    updatePet: () => mutationOptions({
      mutationFn: async (parameters: Schema.Schema.Type<typeof UpdatePet_Parameters>) => await makeRequest({
        method: "put",
        path: "/pet",
        parameterSchema: UpdatePet_Parameters,
        parameters,
        responseSchema: UpdatePet_Response
      })
    }),
    /**
    ### Finds Pets by status.
    Multiple status values can be provided with comma separated strings.
    **/
    findPetsByStatus: (parameters: Schema.Schema.Type<typeof FindPetsByStatus_Parameters>) => queryOptions({
      queryKey: ["FindPetsByStatus", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/pet/findByStatus",
        parameterSchema: FindPetsByStatus_Parameters,
        parameters,
        responseSchema: FindPetsByStatus_Response
      })
    }),
    /**
    ### Finds Pets by tags.
    Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
    **/
    findPetsByTags: (parameters: Schema.Schema.Type<typeof FindPetsByTags_Parameters>) => queryOptions({
      queryKey: ["FindPetsByTags", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/pet/findByTags",
        parameterSchema: FindPetsByTags_Parameters,
        parameters,
        responseSchema: FindPetsByTags_Response
      })
    }),
    /**
    ### Find pet by ID.
    Returns a single pet.
    **/
    getPetById: (parameters: Schema.Schema.Type<typeof GetPetById_Parameters>) => queryOptions({
      queryKey: ["GetPetById", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/pet/{petId}",
        parameterSchema: GetPetById_Parameters,
        parameters,
        responseSchema: GetPetById_Response
      })
    }),
    /**
    ### Updates a pet in the store with form data.
    Updates a pet resource based on the form data.
    **/
    updatePetWithForm: () => mutationOptions({
      mutationFn: async (parameters: Schema.Schema.Type<typeof UpdatePetWithForm_Parameters>) => await makeRequest({
        method: "post",
        path: "/pet/{petId}",
        parameterSchema: UpdatePetWithForm_Parameters,
        parameters,
        responseSchema: UpdatePetWithForm_Response
      })
    }),
    /**
    ### Deletes a pet.
    Delete a pet.
    **/
    deletePet: () => mutationOptions({
      mutationFn: async (parameters: Schema.Schema.Type<typeof DeletePet_Parameters>) => await makeRequest({
        method: "delete",
        path: "/pet/{petId}",
        parameterSchema: DeletePet_Parameters,
        parameters
      })
    }),
    /**
    ### Uploads an image.
    Upload image of the pet.
    **/
    uploadFile: () => mutationOptions({
      mutationFn: async (parameters: Schema.Schema.Type<typeof UploadFile_Parameters>) => await makeRequest({
        method: "post",
        path: "/pet/{petId}/uploadImage",
        parameterSchema: UploadFile_Parameters,
        parameters,
        responseSchema: UploadFile_Response
      })
    }),
    /**
    ### Returns pet inventories by status.
    Returns a map of status codes to quantities.
    **/
    getInventory: (parameters: Schema.Schema.Type<typeof GetInventory_Parameters>) => queryOptions({
      queryKey: ["GetInventory", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/store/inventory",
        parameterSchema: GetInventory_Parameters,
        parameters,
        responseSchema: GetInventory_Response
      })
    }),
    /**
    ### Place an order for a pet.
    Place a new order in the store.
    **/
    placeOrder: () => mutationOptions({
      mutationFn: async (parameters: Schema.Schema.Type<typeof PlaceOrder_Parameters>) => await makeRequest({
        method: "post",
        path: "/store/order",
        parameterSchema: PlaceOrder_Parameters,
        parameters,
        responseSchema: PlaceOrder_Response
      })
    }),
    /**
    ### Find purchase order by ID.
    For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
    **/
    getOrderById: (parameters: Schema.Schema.Type<typeof GetOrderById_Parameters>) => queryOptions({
      queryKey: ["GetOrderById", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/store/order/{orderId}",
        parameterSchema: GetOrderById_Parameters,
        parameters,
        responseSchema: GetOrderById_Response
      })
    }),
    /**
    ### Delete purchase order by identifier.
    For valid response try integer IDs with value < 1000. Anything above 1000 or non-integers will generate API errors.
    **/
    deleteOrder: () => mutationOptions({
      mutationFn: async (parameters: Schema.Schema.Type<typeof DeleteOrder_Parameters>) => await makeRequest({
        method: "delete",
        path: "/store/order/{orderId}",
        parameterSchema: DeleteOrder_Parameters,
        parameters
      })
    }),
    /**
    ### Create user.
    This can only be done by the logged in user.
    **/
    createUser: () => mutationOptions({
      mutationFn: async (parameters: Schema.Schema.Type<typeof CreateUser_Parameters>) => await makeRequest({
        method: "post",
        path: "/user",
        parameterSchema: CreateUser_Parameters,
        parameters,
        responseSchema: CreateUser_Response
      })
    }),
    /**
    ### Creates list of users with given input array.
    Creates list of users with given input array.
    **/
    createUsersWithListInput: () => mutationOptions({
      mutationFn: async (parameters: Schema.Schema.Type<typeof CreateUsersWithListInput_Parameters>) => await makeRequest({
        method: "post",
        path: "/user/createWithList",
        parameterSchema: CreateUsersWithListInput_Parameters,
        parameters,
        responseSchema: CreateUsersWithListInput_Response
      })
    }),
    /**
    ### Logs user into the system.
    Log into the system.
    **/
    loginUser: (parameters: Schema.Schema.Type<typeof LoginUser_Parameters>) => queryOptions({
      queryKey: ["LoginUser", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/user/login",
        parameterSchema: LoginUser_Parameters,
        parameters,
        responseSchema: LoginUser_Response
      })
    }),
    /**
    ### Logs out current logged in user session.
    Log user out of the system.
    **/
    logoutUser: (parameters: Schema.Schema.Type<typeof LogoutUser_Parameters>) => queryOptions({
      queryKey: ["LogoutUser", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/user/logout",
        parameterSchema: LogoutUser_Parameters,
        parameters
      })
    }),
    /**
    ### Get user by user name.
    Get user detail based on username.
    **/
    getUserByName: (parameters: Schema.Schema.Type<typeof GetUserByName_Parameters>) => queryOptions({
      queryKey: ["GetUserByName", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/user/{username}",
        parameterSchema: GetUserByName_Parameters,
        parameters,
        responseSchema: GetUserByName_Response
      })
    }),
    /**
    ### Update user resource.
    This can only be done by the logged in user.
    **/
    updateUser: () => mutationOptions({
      mutationFn: async (parameters: Schema.Schema.Type<typeof UpdateUser_Parameters>) => await makeRequest({
        method: "put",
        path: "/user/{username}",
        parameterSchema: UpdateUser_Parameters,
        parameters
      })
    }),
    /**
    ### Delete user resource.
    This can only be done by the logged in user.
    **/
    deleteUser: () => mutationOptions({
      mutationFn: async (parameters: Schema.Schema.Type<typeof DeleteUser_Parameters>) => await makeRequest({
        method: "delete",
        path: "/user/{username}",
        parameterSchema: DeleteUser_Parameters,
        parameters
      })
    })
  };
}
export const useAddPet = () => {
  const api = useApi();
  return useMutation(api.addPet());
};
export const useUpdatePet = () => {
  const api = useApi();
  return useMutation(api.updatePet());
};
export const useFindPetsByStatus = (parameters: Schema.Schema.Type<typeof FindPetsByStatus_Parameters>) => {
  const api = useApi();
  return useQuery(api.findPetsByStatus(parameters));
};
export const useFindPetsByTags = (parameters: Schema.Schema.Type<typeof FindPetsByTags_Parameters>) => {
  const api = useApi();
  return useQuery(api.findPetsByTags(parameters));
};
export const useGetPetById = (parameters: Schema.Schema.Type<typeof GetPetById_Parameters>) => {
  const api = useApi();
  return useQuery(api.getPetById(parameters));
};
export const useUpdatePetWithForm = () => {
  const api = useApi();
  return useMutation(api.updatePetWithForm());
};
export const useDeletePet = () => {
  const api = useApi();
  return useMutation(api.deletePet());
};
export const useUploadFile = () => {
  const api = useApi();
  return useMutation(api.uploadFile());
};
export const useGetInventory = (parameters: Schema.Schema.Type<typeof GetInventory_Parameters>) => {
  const api = useApi();
  return useQuery(api.getInventory(parameters));
};
export const usePlaceOrder = () => {
  const api = useApi();
  return useMutation(api.placeOrder());
};
export const useGetOrderById = (parameters: Schema.Schema.Type<typeof GetOrderById_Parameters>) => {
  const api = useApi();
  return useQuery(api.getOrderById(parameters));
};
export const useDeleteOrder = () => {
  const api = useApi();
  return useMutation(api.deleteOrder());
};
export const useCreateUser = () => {
  const api = useApi();
  return useMutation(api.createUser());
};
export const useCreateUsersWithListInput = () => {
  const api = useApi();
  return useMutation(api.createUsersWithListInput());
};
export const useLoginUser = (parameters: Schema.Schema.Type<typeof LoginUser_Parameters>) => {
  const api = useApi();
  return useQuery(api.loginUser(parameters));
};
export const useLogoutUser = (parameters: Schema.Schema.Type<typeof LogoutUser_Parameters>) => {
  const api = useApi();
  return useQuery(api.logoutUser(parameters));
};
export const useGetUserByName = (parameters: Schema.Schema.Type<typeof GetUserByName_Parameters>) => {
  const api = useApi();
  return useQuery(api.getUserByName(parameters));
};
export const useUpdateUser = () => {
  const api = useApi();
  return useMutation(api.updateUser());
};
export const useDeleteUser = () => {
  const api = useApi();
  return useMutation(api.deleteUser());
};