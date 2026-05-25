# Sohcah.OpenApi.Swashbuckle.Vogen

Swashbuckle.AspNetCore filter that decorates [Vogen](https://github.com/SteveDunn/Vogen) value objects in generated OpenAPI schemas with an `x-sohcah-brand-id` extension, enabling client-side branded type generation.

## Install

```sh
dotnet add package Sohcah.OpenApi.Swashbuckle.Vogen
```

## Usage

```csharp
services.AddSwaggerGen(options =>
{
    options.AddVogenBrandIdFilter();
});
```

Each schema or parameter whose CLR type is a Vogen `[ValueObject]` will get:

```json
"x-sohcah-brand-id": "MyValueObjectType"
```

## License

MIT
