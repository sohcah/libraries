import * as Schema from "effect/Schema";
import { queryOptions } from "@tanstack/react-query";
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
  status: Schema.Literal("available", "pending", "sold").pipe(Schema.mutable).pipe(Schema.optional)
}).pipe(Schema.mutable);
export type Pet = Schema.Schema.Type<typeof Pet>;
export const AddPet_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  data: Schema.parseJson(Pet)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    body: from.data
  })
});
export const AddPet_Response = Schema.parseJson(Pet);
export const UpdatePet_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  data: Schema.parseJson(Pet)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    body: from.data
  })
});
export const UpdatePet_Response = Schema.parseJson(Pet);
export const FindPetsByStatus_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  status: Schema.Literal("available", "pending", "sold").pipe(Schema.mutable)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    query: new URLSearchParams([["status", String(from.status)]])
  })
});
export const FindPetsByStatus_Response = Schema.parseJson(Schema.Array(Pet).pipe(Schema.mutable).pipe(Schema.mutable));
export const FindPetsByTags_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  tags: Schema.Array(Schema.String.pipe(Schema.mutable)).pipe(Schema.mutable).pipe(Schema.mutable)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    query: new URLSearchParams([["tags", String(from.tags)]])
  })
});
export const FindPetsByTags_Response = Schema.parseJson(Schema.Array(Pet).pipe(Schema.mutable).pipe(Schema.mutable));
export const GetPetById_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  petId: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    path: {
      petId: String(from.petId)
    }
  })
});
export const GetPetById_Response = Schema.parseJson(Pet);
export const UpdatePetWithForm_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  petId: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable),
  name: Schema.String.pipe(Schema.mutable),
  status: Schema.String.pipe(Schema.mutable)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    query: new URLSearchParams([["name", String(from.name)], ["status", String(from.status)]]),
    path: {
      petId: String(from.petId)
    }
  })
});
export const UpdatePetWithForm_Response = Schema.parseJson(Pet);
export const DeletePet_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  api_key: Schema.String.pipe(Schema.mutable),
  petId: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    path: {
      petId: String(from.petId)
    },
    header: new Headers([["api_key", String(from.api_key)]])
  })
});
export const UploadFile_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  petId: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable),
  additionalMetadata: Schema.String.pipe(Schema.mutable),
  data: Schema.instanceOf(Blob)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
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
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({})
});
export const GetInventory_Response = Schema.parseJson(Schema.Struct({}).pipe(Schema.mutable));
export const Order = Schema.Struct({
  id: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable).pipe(Schema.optional),
  petId: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable).pipe(Schema.optional),
  quantity: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable).pipe(Schema.optional),
  shipDate: Schema.String.pipe(Schema.mutable).pipe(Schema.optional),
  status: Schema.Literal("placed", "approved", "delivered").pipe(Schema.mutable).pipe(Schema.optional),
  complete: Schema.Boolean.pipe(Schema.mutable).pipe(Schema.optional)
}).pipe(Schema.mutable);
export type Order = Schema.Schema.Type<typeof Order>;
export const PlaceOrder_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  data: Schema.parseJson(Order)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    body: from.data
  })
});
export const PlaceOrder_Response = Schema.parseJson(Order);
export const GetOrderById_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  orderId: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    path: {
      orderId: String(from.orderId)
    }
  })
});
export const GetOrderById_Response = Schema.parseJson(Order);
export const DeleteOrder_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  orderId: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
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
  userStatus: Schema.Number.pipe(Schema.int()).pipe(Schema.mutable).pipe(Schema.optional)
}).pipe(Schema.mutable);
export type User = Schema.Schema.Type<typeof User>;
export const CreateUser_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  data: Schema.parseJson(User)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    body: from.data
  })
});
export const CreateUser_Response = Schema.parseJson(User);
export const CreateUsersWithListInput_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  data: Schema.parseJson(Schema.Array(User).pipe(Schema.mutable).pipe(Schema.mutable))
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    body: from.data
  })
});
export const CreateUsersWithListInput_Response = Schema.parseJson(User);
export const LoginUser_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  username: Schema.String.pipe(Schema.mutable),
  password: Schema.String.pipe(Schema.mutable)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    query: new URLSearchParams([["username", String(from.username)], ["password", String(from.password)]])
  })
});
export const LoginUser_Response = Schema.parseJson(Schema.String.pipe(Schema.mutable));
export const LogoutUser_Parameters = Schema.transform(ParametersSchema, Schema.Struct({}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({})
});
export const GetUserByName_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  username: Schema.String.pipe(Schema.mutable)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    path: {
      username: String(from.username)
    }
  })
});
export const GetUserByName_Response = Schema.parseJson(User);
export const UpdateUser_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  username: Schema.String.pipe(Schema.mutable),
  data: Schema.parseJson(User)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    path: {
      username: String(from.username)
    },
    body: from.data
  })
});
export const DeleteUser_Parameters = Schema.transform(ParametersSchema, Schema.Struct({
  username: Schema.String.pipe(Schema.mutable)
}), {
  strict: true,
  decode: () => {
    throw new Error("Not implemented");
  },
  encode: from => ({
    path: {
      username: String(from.username)
    }
  })
});
export function useApi() {
  return {
    AddPet: (parameters: Schema.Schema.Type<typeof AddPet_Parameters>) => queryOptions({
      queryKey: ["AddPet", parameters],
      queryFn: async () => await makeRequest({
        method: "post",
        path: "/pet",
        parameterSchema: AddPet_Parameters,
        parameters,
        responseSchema: AddPet_Response
      })
    }),
    UpdatePet: (parameters: Schema.Schema.Type<typeof UpdatePet_Parameters>) => queryOptions({
      queryKey: ["UpdatePet", parameters],
      queryFn: async () => await makeRequest({
        method: "put",
        path: "/pet",
        parameterSchema: UpdatePet_Parameters,
        parameters,
        responseSchema: UpdatePet_Response
      })
    }),
    FindPetsByStatus: (parameters: Schema.Schema.Type<typeof FindPetsByStatus_Parameters>) => queryOptions({
      queryKey: ["FindPetsByStatus", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/pet/findByStatus",
        parameterSchema: FindPetsByStatus_Parameters,
        parameters,
        responseSchema: FindPetsByStatus_Response
      })
    }),
    FindPetsByTags: (parameters: Schema.Schema.Type<typeof FindPetsByTags_Parameters>) => queryOptions({
      queryKey: ["FindPetsByTags", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/pet/findByTags",
        parameterSchema: FindPetsByTags_Parameters,
        parameters,
        responseSchema: FindPetsByTags_Response
      })
    }),
    GetPetById: (parameters: Schema.Schema.Type<typeof GetPetById_Parameters>) => queryOptions({
      queryKey: ["GetPetById", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/pet/{petId}",
        parameterSchema: GetPetById_Parameters,
        parameters,
        responseSchema: GetPetById_Response
      })
    }),
    UpdatePetWithForm: (parameters: Schema.Schema.Type<typeof UpdatePetWithForm_Parameters>) => queryOptions({
      queryKey: ["UpdatePetWithForm", parameters],
      queryFn: async () => await makeRequest({
        method: "post",
        path: "/pet/{petId}",
        parameterSchema: UpdatePetWithForm_Parameters,
        parameters,
        responseSchema: UpdatePetWithForm_Response
      })
    }),
    DeletePet: (parameters: Schema.Schema.Type<typeof DeletePet_Parameters>) => queryOptions({
      queryKey: ["DeletePet", parameters],
      queryFn: async () => await makeRequest({
        method: "delete",
        path: "/pet/{petId}",
        parameterSchema: DeletePet_Parameters,
        parameters
      })
    }),
    UploadFile: (parameters: Schema.Schema.Type<typeof UploadFile_Parameters>) => queryOptions({
      queryKey: ["UploadFile", parameters],
      queryFn: async () => await makeRequest({
        method: "post",
        path: "/pet/{petId}/uploadImage",
        parameterSchema: UploadFile_Parameters,
        parameters,
        responseSchema: UploadFile_Response
      })
    }),
    GetInventory: (parameters: Schema.Schema.Type<typeof GetInventory_Parameters>) => queryOptions({
      queryKey: ["GetInventory", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/store/inventory",
        parameterSchema: GetInventory_Parameters,
        parameters,
        responseSchema: GetInventory_Response
      })
    }),
    PlaceOrder: (parameters: Schema.Schema.Type<typeof PlaceOrder_Parameters>) => queryOptions({
      queryKey: ["PlaceOrder", parameters],
      queryFn: async () => await makeRequest({
        method: "post",
        path: "/store/order",
        parameterSchema: PlaceOrder_Parameters,
        parameters,
        responseSchema: PlaceOrder_Response
      })
    }),
    GetOrderById: (parameters: Schema.Schema.Type<typeof GetOrderById_Parameters>) => queryOptions({
      queryKey: ["GetOrderById", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/store/order/{orderId}",
        parameterSchema: GetOrderById_Parameters,
        parameters,
        responseSchema: GetOrderById_Response
      })
    }),
    DeleteOrder: (parameters: Schema.Schema.Type<typeof DeleteOrder_Parameters>) => queryOptions({
      queryKey: ["DeleteOrder", parameters],
      queryFn: async () => await makeRequest({
        method: "delete",
        path: "/store/order/{orderId}",
        parameterSchema: DeleteOrder_Parameters,
        parameters
      })
    }),
    CreateUser: (parameters: Schema.Schema.Type<typeof CreateUser_Parameters>) => queryOptions({
      queryKey: ["CreateUser", parameters],
      queryFn: async () => await makeRequest({
        method: "post",
        path: "/user",
        parameterSchema: CreateUser_Parameters,
        parameters,
        responseSchema: CreateUser_Response
      })
    }),
    CreateUsersWithListInput: (parameters: Schema.Schema.Type<typeof CreateUsersWithListInput_Parameters>) => queryOptions({
      queryKey: ["CreateUsersWithListInput", parameters],
      queryFn: async () => await makeRequest({
        method: "post",
        path: "/user/createWithList",
        parameterSchema: CreateUsersWithListInput_Parameters,
        parameters,
        responseSchema: CreateUsersWithListInput_Response
      })
    }),
    LoginUser: (parameters: Schema.Schema.Type<typeof LoginUser_Parameters>) => queryOptions({
      queryKey: ["LoginUser", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/user/login",
        parameterSchema: LoginUser_Parameters,
        parameters,
        responseSchema: LoginUser_Response
      })
    }),
    LogoutUser: (parameters: Schema.Schema.Type<typeof LogoutUser_Parameters>) => queryOptions({
      queryKey: ["LogoutUser", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/user/logout",
        parameterSchema: LogoutUser_Parameters,
        parameters
      })
    }),
    GetUserByName: (parameters: Schema.Schema.Type<typeof GetUserByName_Parameters>) => queryOptions({
      queryKey: ["GetUserByName", parameters],
      queryFn: async () => await makeRequest({
        method: "get",
        path: "/user/{username}",
        parameterSchema: GetUserByName_Parameters,
        parameters,
        responseSchema: GetUserByName_Response
      })
    }),
    UpdateUser: (parameters: Schema.Schema.Type<typeof UpdateUser_Parameters>) => queryOptions({
      queryKey: ["UpdateUser", parameters],
      queryFn: async () => await makeRequest({
        method: "put",
        path: "/user/{username}",
        parameterSchema: UpdateUser_Parameters,
        parameters
      })
    }),
    DeleteUser: (parameters: Schema.Schema.Type<typeof DeleteUser_Parameters>) => queryOptions({
      queryKey: ["DeleteUser", parameters],
      queryFn: async () => await makeRequest({
        method: "delete",
        path: "/user/{username}",
        parameterSchema: DeleteUser_Parameters,
        parameters
      })
    })
  };
}