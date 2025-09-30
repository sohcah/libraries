import { z } from "zod/mini";
import { queryOptions, mutationOptions, useQuery, useMutation } from "@tanstack/react-query";
export const ParametersSchema = z.object({
  query: z.optional(z.instanceof(URLSearchParams)),
  headers: z.optional(z.instanceof(Headers)),
  path: z.optional(z.record(z.string(), z.string())),
  body: z.optional(z.union([z.string(), z.instanceof(Blob)]))
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
  parameterSchema: z.ZodMiniType<TParams, {
    query?: URLSearchParams;
    body?: string | Blob;
  }>;
  parameters: TParams;
  responseSchema?: z.ZodMiniType<TResponse, string>;
}) {
  const {
    query: query,
    body: body
  } = z.encode(parameterSchema, parameters);
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
  return z.decode(responseSchema, await response.text());
}
export const Category = z.object({
  id: z.optional(z.int()),
  name: z.optional(z.string())
});
export type Category = z.output<typeof Category>;
export const Tag = z.object({
  id: z.optional(z.int()),
  name: z.optional(z.string())
});
export type Tag = z.output<typeof Tag>;
export const Pet = z.object({
  id: z.optional(z.int()),
  name: z.string(),
  category: z.optional(Category),
  photoUrls: z.array(z.string()),
  tags: z.optional(z.array(Tag)),
  /** pet status in the store*/status: z.optional(z.enum(["available", "pending", "sold"]))
});
export type Pet = z.output<typeof Pet>;
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
  /** Status values that need to be considered for filter*/status: z.optional(z.enum(["available", "pending", "sold"]))
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
  /** Tags to filter by*/tags: z.optional(z.array(z.string()))
}), {
  decode: (from, ctx) => {
    throw new Error("Not implemented");
  },
  encode: (from, ctx) => ({
    query: new URLSearchParams([["tags", String(from.tags)]])
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
  /** Name of pet that needs to be updated*/name: z.optional(z.string()),
  /** Status of pet that needs to be updated*/status: z.optional(z.string())
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
  api_key: z.optional(z.string()),
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
  /** Additional Metadata*/additionalMetadata: z.optional(z.string()),
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
  code: z.optional(z.int()),
  type: z.optional(z.string()),
  message: z.optional(z.string())
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
  id: z.optional(z.int()),
  petId: z.optional(z.int()),
  quantity: z.optional(z.int()),
  shipDate: z.optional(z.string()),
  /** Order Status*/status: z.optional(z.enum(["placed", "approved", "delivered"])),
  complete: z.optional(z.boolean())
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
  id: z.optional(z.int()),
  username: z.optional(z.string()),
  firstName: z.optional(z.string()),
  lastName: z.optional(z.string()),
  email: z.optional(z.string()),
  password: z.optional(z.string()),
  phone: z.optional(z.string()),
  /** User Status*/userStatus: z.optional(z.int())
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
  /** The user name for login*/username: z.optional(z.string()),
  /** The password for login in clear text*/password: z.optional(z.string())
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
export function useApi() {
  return {
    /**
    ### Add a new pet to the store.
    Add a new pet to the store.
    **/
    addPet: () => mutationOptions({
      mutationFn: async (parameters: z.output<typeof AddPet_Parameters>) => await makeRequest({
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
      mutationFn: async (parameters: z.output<typeof UpdatePet_Parameters>) => await makeRequest({
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
    findPetsByStatus: (parameters: z.output<typeof FindPetsByStatus_Parameters>) => queryOptions({
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
    findPetsByTags: (parameters: z.output<typeof FindPetsByTags_Parameters>) => queryOptions({
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
    getPetById: (parameters: z.output<typeof GetPetById_Parameters>) => queryOptions({
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
      mutationFn: async (parameters: z.output<typeof UpdatePetWithForm_Parameters>) => await makeRequest({
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
      mutationFn: async (parameters: z.output<typeof DeletePet_Parameters>) => await makeRequest({
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
      mutationFn: async (parameters: z.output<typeof UploadFile_Parameters>) => await makeRequest({
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
    getInventory: (parameters: z.output<typeof GetInventory_Parameters>) => queryOptions({
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
      mutationFn: async (parameters: z.output<typeof PlaceOrder_Parameters>) => await makeRequest({
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
    getOrderById: (parameters: z.output<typeof GetOrderById_Parameters>) => queryOptions({
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
      mutationFn: async (parameters: z.output<typeof DeleteOrder_Parameters>) => await makeRequest({
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
      mutationFn: async (parameters: z.output<typeof CreateUser_Parameters>) => await makeRequest({
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
      mutationFn: async (parameters: z.output<typeof CreateUsersWithListInput_Parameters>) => await makeRequest({
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
    loginUser: (parameters: z.output<typeof LoginUser_Parameters>) => queryOptions({
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
    logoutUser: (parameters: z.output<typeof LogoutUser_Parameters>) => queryOptions({
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
    getUserByName: (parameters: z.output<typeof GetUserByName_Parameters>) => queryOptions({
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
      mutationFn: async (parameters: z.output<typeof UpdateUser_Parameters>) => await makeRequest({
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
      mutationFn: async (parameters: z.output<typeof DeleteUser_Parameters>) => await makeRequest({
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
export const useFindPetsByStatus = (parameters: z.output<typeof FindPetsByStatus_Parameters>) => {
  const api = useApi();
  return useQuery(api.findPetsByStatus(parameters));
};
export const useFindPetsByTags = (parameters: z.output<typeof FindPetsByTags_Parameters>) => {
  const api = useApi();
  return useQuery(api.findPetsByTags(parameters));
};
export const useGetPetById = (parameters: z.output<typeof GetPetById_Parameters>) => {
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
export const useGetInventory = (parameters: z.output<typeof GetInventory_Parameters>) => {
  const api = useApi();
  return useQuery(api.getInventory(parameters));
};
export const usePlaceOrder = () => {
  const api = useApi();
  return useMutation(api.placeOrder());
};
export const useGetOrderById = (parameters: z.output<typeof GetOrderById_Parameters>) => {
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
export const useLoginUser = (parameters: z.output<typeof LoginUser_Parameters>) => {
  const api = useApi();
  return useQuery(api.loginUser(parameters));
};
export const useLogoutUser = (parameters: z.output<typeof LogoutUser_Parameters>) => {
  const api = useApi();
  return useQuery(api.logoutUser(parameters));
};
export const useGetUserByName = (parameters: z.output<typeof GetUserByName_Parameters>) => {
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