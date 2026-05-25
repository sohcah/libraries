# Sohcah.OpenApi.Swashbuckle

Swashbuckle.AspNetCore extensions for OpenAPI generation.

## Features

- `[ExtensibleUnion]` attribute to add an `x-sohcah-extensible-union` extension to Swashbuckle schemas.

## Install

```sh
dotnet add package Sohcah.OpenApi.Swashbuckle
```

## Usage

```csharp
[ExtensibleUnion]
public abstract class MyUnionBase { /* ... */ }
```

## License

MIT
