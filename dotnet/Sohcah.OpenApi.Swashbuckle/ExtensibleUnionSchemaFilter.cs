using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Sohcah.OpenApi.Swashbuckle;

public class ExtensibleUnionSchemaFilter : ISchemaFilter
{
    public void Apply(IOpenApiSchema schema, SchemaFilterContext context)
    {
        if (schema is not OpenApiSchema directSchema) return;
        directSchema.AddExtension("x-sohcah-extensible-union", new JsonNodeExtension(true));
    }
}