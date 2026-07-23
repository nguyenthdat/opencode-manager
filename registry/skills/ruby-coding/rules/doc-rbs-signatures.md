# doc-rbs-signatures

> Write RBS signatures for public APIs

## Why It Matters

RBS (Ruby Signature) provides static type checking for Ruby. Write .rbs files for your gem's public API to enable type checking via Steep or Sorbet, and for IDE auto-completion.

## Bad

# No type information -- callers must read source code
# to understand expected types and return values
```


## Good

# sig/my_gem.rbs
```rbs
module MyGem
  class Client
    attr_reader base_url: String

    def initialize: (base_url: String, timeout: Integer) -> void
    def get: (String path) -> Response
    def post: (String path, Hash[Symbol, untyped] body) -> Response
  end
end
```


## See Also

- [doc-yard-format](./doc-yard-format.md)
- [api-public-api-minimal](./api-public-api-minimal.md)
