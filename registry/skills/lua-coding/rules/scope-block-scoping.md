# scope-block-scoping

> Use `do ... end` blocks to scope temporary locals

## Why It Matters

Lua doesn't have block-scoped `{}` like C-family languages; any `do...end`, `if`, `for`, or `while` body is a scope. A bare `do...end` block (with no associated control structure) is a legitimate, idiomatic way to limit a temporary local's lifetime and prevent it from leaking into the rest of the function, without needing to extract a separate function.

## Bad

```lua
local function build_report(data)
  local raw = fetch_raw(data)
  local parsed = parse(raw)
  local validated = validate(parsed)
  -- raw and parsed are still in scope here even though they're never
  -- needed again -- easy to accidentally reuse a stale value later
  return format(validated)
end
```

## Good

```lua
local function build_report(data)
  local validated
  do
    local raw = fetch_raw(data)
    local parsed = parse(raw)
    validated = validate(parsed)
  end
  -- raw and parsed are out of scope here; only validated survives
  return format(validated)
end
```

## Also Useful for Namespacing Constants

```lua
local directions
do
  local UP, DOWN, LEFT, RIGHT = 1, 2, 3, 4
  directions = { up = UP, down = DOWN, left = LEFT, right = RIGHT }
end
-- UP/DOWN/LEFT/RIGHT are gone; only the `directions` table remains
```

## See Also

- [scope-minimize-scope](scope-minimize-scope.md)
- [scope-local-by-default](scope-local-by-default.md)
- [proj-single-responsibility-module](proj-single-responsibility-module.md)
