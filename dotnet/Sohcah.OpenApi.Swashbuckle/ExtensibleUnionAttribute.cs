using JetBrains.Annotations;
using Swashbuckle.AspNetCore.Annotations;

namespace Sohcah.OpenApi.Swashbuckle;

[PublicAPI]
public class ExtensibleUnionAttribute() : SwaggerSchemaFilterAttribute(typeof(ExtensibleUnionSchemaFilter));
