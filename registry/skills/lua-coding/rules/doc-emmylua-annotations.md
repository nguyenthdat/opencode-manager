# doc-emmylua-annotations

> Use EmmyLua/LuaCATS `---@param`/`---@return` annotations for editor tooling

## Why It Matters

Lua's dynamic typing means editors and static checkers (`lua-language-server`, formerly "sumneko") have no type information to offer unless you provide it via structured doc comments. The EmmyLua-derived annotation syntax (now standardized as "LuaCATS" — Lua Comment And Type System) is understood by `lua-language-server`, giving real-time type checking, autocomplete, and inline documentation in any editor that uses it — which is nearly universal in modern Lua development, including Neovim configuration itself.

## Bad

```lua
-- calculates shipping cost based on weight and destination
local function calculate_shipping(weight, destination)
  ...
end
```

## Good

```lua
---Calculates shipping cost based on weight and destination.
---@param weight number Weight in kilograms
---@param destination string ISO country code, e.g. "US"
---@return number cost Shipping cost in USD
---@return string? err Error message if the destination is unsupported
local function calculate_shipping(weight, destination)
  ...
end
```

## Editor-Visible Benefits

With these annotations in place, `lua-language-server` will:
- Flag `calculate_shipping("2kg", "US")` as a type error (expects `number`, got `string`)
- Autocomplete the return values with their documented names/types
- Show the doc comment as hover text at every call site

## Optional and Union Types

```lua
---@param opts { timeout: number, retries: number? }  Options table
---@param callback (fun(err: string?, result: table?))?  Optional callback
local function fetch(url, opts, callback) ... end
```

## See Also

- [doc-class-annotations](doc-class-annotations.md)
- [doc-function-signature](doc-function-signature.md)
- [lint-type-check-lua-ls](lint-type-check-lua-ls.md)
