# scope-shadowing

> Avoid confusing shadowing of outer locals, parameters, or common globals

## Why It Matters

Lua permits redeclaring a `local` with the same name in a nested scope, silently shadowing the outer one. This is occasionally useful (rebinding a variable to a validated/parsed version of itself) but is a common source of confusion and bugs when it happens accidentally — especially when a loop variable, parameter, or well-known standard library name (`string`, `table`, `type`) gets shadowed unintentionally.

## Bad

```lua
local function process(items)
  local total = 0
  for _, items in ipairs(items) do  -- shadows the outer `items` parameter!
    total = total + items
  end
  return total, items  -- `items` here refers to the loop variable's last value,
                        -- not the original parameter -- confusing and buggy
end

local function parse(string)  -- shadows the `string` standard library table
  return string.format("%d", tonumber(string))  -- string.format now fails:
                                                 -- `string` is a number here!
end
```

## Good

```lua
local function process(items)
  local total = 0
  for _, value in ipairs(items) do  -- distinct name, no shadowing
    total = total + value
  end
  return total, items
end

local function parse(input)  -- doesn't shadow the `string` library
  return string.format("%d", tonumber(input))
end
```

## When Shadowing Is Intentional and Fine

```lua
-- Rebinding to a validated/parsed version of the same concept is a common,
-- accepted idiom -- keep the shadowing scope small and obvious
local function load_config(path)
  local path = path or "config.lua"  -- narrow, immediately-adjacent shadow
  return dofile(path)
end
```

## See Also

- [scope-minimize-scope](scope-minimize-scope.md)
- [name-avoid-reserved-like](name-avoid-reserved-like.md)
- [scope-local-by-default](scope-local-by-default.md)
