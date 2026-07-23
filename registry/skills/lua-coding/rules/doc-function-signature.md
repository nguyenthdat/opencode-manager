# doc-function-signature

> Document parameter types and nullability explicitly

## Why It Matters

Since Lua doesn't enforce types at all, a function's actual contract — which arguments are required, which can be `nil`, what shape a table argument must have — lives entirely in documentation (and annotations). Leaving this implicit means every caller has to read the function body to figure out what's actually required.

## Bad

```lua
-- accepts options for creating a widget
local function create_widget(opts) ... end
```

## Good

```lua
---Creates a new UI widget.
---@param opts table Widget options
---@param opts.label string Text shown on the widget (required)
---@param opts.width number? Widget width in pixels (default: 100)
---@param opts.on_click (fun(widget: table))? Click handler (optional)
---@return table widget The created widget instance
local function create_widget(opts)
  assert(type(opts) == "table" and opts.label, "opts.label is required")
  return {
    label = opts.label,
    width = opts.width or 100,
    on_click = opts.on_click,
  }
end
```

## Nullable vs. Required, Made Explicit

The `?` suffix on a type (`string?`, `number?`) is the LuaCATS/EmmyLua convention for "this may be `nil`" — using it consistently means a reader (and `lua-language-server`) can tell at a glance which parameters truly require a value.

```lua
---@param retries number? Number of retries (default: 3, nil means use default)
---@param token string Required auth token, must not be nil
local function call_api(retries, token) ... end
```

## See Also

- [doc-emmylua-annotations](doc-emmylua-annotations.md)
- [err-validate-args](err-validate-args.md)
- [api-options-table](api-options-table.md)
