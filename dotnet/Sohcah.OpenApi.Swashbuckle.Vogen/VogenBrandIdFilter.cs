using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using Vogen;

namespace Sohcah.OpenApi.Swashbuckle.Vogen;

public class VogenBrandIdFilter : IParameterFilter, ISchemaFilter
{
    private void Apply(IOpenApiSchema schema, Type type)
    {
        if (schema is OpenApiSchema directSchema && Attribute.IsDefined(type, typeof(ValueObjectAttribute)))
        {
            directSchema.AddExtension("x-sohcah-brand-id", new JsonNodeExtension(type.Name));
        }

        if (type.GetGenericArguments() is [var genericType] &&
            Attribute.IsDefined(genericType, typeof(ValueObjectAttribute)))
        {
            if (schema.Items is OpenApiSchema schemaItems)
            {
                schemaItems.AddExtension("x-sohcah-brand-id", new JsonNodeExtension(genericType.Name));
            }

            if (type.GetGenericTypeDefinition() == typeof(Nullable<>) && schema is OpenApiSchema nullableSchema)
            {
                nullableSchema.AddExtension("x-sohcah-brand-id", new JsonNodeExtension(genericType.Name));
            }
        }

        if (type.GetElementType() is {} elementType && Attribute.IsDefined(elementType, typeof(ValueObjectAttribute)))
        {
            if (schema.Items is OpenApiSchema schemaItems)
            {
                schemaItems.AddExtension("x-sohcah-brand-id", new JsonNodeExtension(elementType.Name));
            }
        }
    }

    public void Apply(IOpenApiParameter parameter, ParameterFilterContext context)
    {
        if (parameter.Schema is null) return;
        if (context.ParameterInfo is null) return;

        Apply(parameter.Schema, context.ParameterInfo.ParameterType);
    }

    public void Apply(IOpenApiSchema schema, SchemaFilterContext context)
    {
        Apply(schema, context.Type);
    }
}
