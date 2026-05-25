using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Sohcah.OpenApi.Swashbuckle;

public class ExtensibleUnionSchemaFilter : ISchemaFilter
{
    public void Apply(IOpenApiSchema schema, SchemaFilterContext context)
    {
        ((OpenApiSchema)schema).AddExtension("x-sohcah-extensible-union", new JsonNodeExtension(true));
    }
}