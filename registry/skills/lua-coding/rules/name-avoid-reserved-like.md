# name-avoid-reserved-like

> Avoid shadowing common globals/standard-library names as local identifiers

## Why It Matters

`string`, `table`, `type`, `pairs`, `next`, and similar standard-library identifiers are not reserved keywords in Lua — you *can* declare a local named `string` — but doing so shadows the standard library table for the rest of that scope, silently breaking any later use of `string.format` or similar within it. This is a subtle, hard-to-spot bug class distinct from ordinary shadowing of your own variables.

## Bad

```lua
local function build_message(string, count)  -- shadows the `string` library!
  return string .. " x" .. count               -- happens to still "work" here,
                                                 -- but string.format is now unreachable
                                                 -- anywhere later in this function
end

local function parse(type)   -- shadows the `type()` builtin function
  if type == "number" then   -- fine here, but calling type(x) later would fail:
    -- type(value)           -- error: attempt to call a string value
  end
end
```

## Good

```lua
local function build_message(text, count)
  return text .. " x" .. count
end

local function parse(value_type)
  if value_type == "number" then
    ...
  end
end

-- If you genuinely need a local alias to a stdlib table for perf reasons,
-- give it a distinct name (see perf-local-cache-globals):
local str_format = string.format   -- fine: doesn't shadow `string` itself
```

## Names Most Worth Avoiding

`string`, `table`, `math`, `os`, `io`, `type`, `pairs`, `ipairs`, `next`, `select`, `error`, `assert`, `self` (outside method definitions), and any embedding-specific global (`vim`, `ngx`, `love`).

## See Also

- [scope-shadowing](scope-shadowing.md)
- [perf-local-cache-globals](perf-local-cache-globals.md)
- [embed-sandbox-restrict-env](embed-sandbox-restrict-env.md)
