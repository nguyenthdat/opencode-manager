# proj-flat-small-project

> Keep small scripts flat; avoid premature module nesting

## Why It Matters

A 200-line script split into eight single-function files nested three directories deep adds navigation overhead (constantly jumping between files) without any corresponding benefit — nesting and module boundaries earn their cost only once a codebase is big enough that a flat structure becomes hard to scan.

## Bad

```
src/
  core/
    utils/
      string/
        trim.lua        -- one 5-line function, buried four directories deep
      table/
        merge.lua        -- another 5-line function, equally over-nested
  handlers/
    http/
      routes/
        health.lua        -- a single trivial handler in its own nested file
```

## Good

```
src/
  utils.lua      -- trim(), merge(), and other small helpers together
  handlers.lua   -- health_check(), and other route handlers together
  main.lua
```

```lua
-- utils.lua
local M = {}

function M.trim(s) return s:match("^%s*(.-)%s*$") end
function M.merge(a, b)
  local result = {}
  for k, v in pairs(a) do result[k] = v end
  for k, v in pairs(b) do result[k] = v end
  return result
end

return M
```

## When to Split

Split a flat file once it genuinely grows unwieldy (several hundred lines, multiple unrelated responsibilities) or once a piece of it is reused across multiple independent scripts — split by feature/responsibility at that point, not preemptively.

## See Also

- [proj-single-responsibility-module](proj-single-responsibility-module.md)
- [proj-src-lua-layout](proj-src-lua-layout.md)
- [scope-block-scoping](scope-block-scoping.md)
