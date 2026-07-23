# scope-close-attribute

> Use the `<close>` attribute (Lua 5.4+) for deterministic resource cleanup

## Why It Matters

Lua 5.4's `<close>` attribute calls a value's `__close` metamethod when the variable goes out of scope — on normal exit, `break`, `return`, `goto`, *and* on error propagation through the block. This gives Lua a `finally`-like guarantee without wrapping every call site in `pcall`, which matters for file handles, locks, and other resources that must be released even when an error is thrown mid-block.

## Bad

```lua
-- Lua 5.4, manual cleanup -- easy to forget on the error path
local function process_file(path)
  local file = io.open(path, "r")
  local ok, err = pcall(function()
    return do_risky_processing(file)
  end)
  file:close()   -- fine here, but every function that opens a resource
                 -- needs this same boilerplate, and it's easy to omit
  if not ok then error(err, 0) end
end
```

## Good

```lua
-- Lua 5.4: <close> guarantees __close runs on any exit path, including errors
local function process_file(path)
  local file <close> = assert(io.open(path, "r"))
  -- file:close() is called automatically here, even if do_risky_processing errors
  return do_risky_processing(file)
end

-- Custom closable values: any table with a __close metamethod qualifies
local function locked(mutex)
  mutex:lock()
  return setmetatable({}, { __close = function() mutex:unlock() end })
end

local function critical_section(mutex)
  local guard <close> = locked(mutex)
  do_work()  -- mutex:unlock() runs automatically when this scope exits
end
```

## Version Note

`<close>` is Lua 5.4 only. On earlier versions or LuaJIT, use explicit `pcall` + cleanup, or a hand-rolled RAII-style helper that takes a callback.

## See Also

- [scope-const-attribute](scope-const-attribute.md)
- [err-finally-pattern](err-finally-pattern.md)
- [err-pcall-protect](err-pcall-protect.md)
