using JetBrains.Annotations;
using Microsoft.Extensions.DependencyInjection;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Sohcah.OpenApi.Swashbuckle.Vogen;

public static class SwaggerGenOptionsExtensions
{
    [PublicAPI]
    public static void AddVogenBrandIdFilter(this SwaggerGenOptions options)
    {
        options.ParameterFilter<VogenBrandIdFilter>();
        options.SchemaFilter<VogenBrandIdFilter>();
    }
}
