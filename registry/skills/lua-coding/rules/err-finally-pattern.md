# err-finally-pattern

> Emulate `try/finally` with `pcall` + cleanup, or `<close>` on 5.4

## Why It Matters

Lua has no `finally` keyword. Without a deliberate pattern, cleanup code placed after a risky call is skipped whenever that call errors, because `error()` unwinds the stack past it. This routinely leaks file handles, locks, and connections in code paths that hit an unexpected error.

## Bad

```lua
local function process(path)
  local file = io.open(path, "r")
  local data = file:read("*a")   -- if this (or later code) errors,
  local result = transform(data) -- file:close() below never runs
  file:close()
  return result
end
```

## Good

```lua
-- Portable pattern (Lua 5.1-5.4, LuaJIT): pcall + explicit cleanup
local function process(path)
  local file = io.open(path, "r")
  if not file then return nil, "cannot open " .. path end

  local ok, result_or_err = pcall(function()
    local data = file:read("*a")
    return transform(data)
  end)

  file:close()  -- always runs, whether the body succeeded or errored

  if not ok then
    return nil, result_or_err
  end
  return result_or_err
end
```

```lua
-- Lua 5.4: <close> gives this for free, including on error/break/goto
local function process_54(path)
  local file <close> = assert(io.open(path, "r"))
  local data = file:read("*a")
  return transform(data)  -- file automatically closed on any exit path
end
```

## See Also

- [scope-close-attribute](scope-close-attribute.md)
- [err-pcall-protect](err-pcall-protect.md)
- [err-propagate-context](err-propagate-context.md)
