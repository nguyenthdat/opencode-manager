# coro-yield-across-pcall

> Know your target version's limits on yielding across `pcall`

## Why It Matters

Lua 5.1's coroutine implementation cannot yield across a C call boundary — which historically included `pcall`/`xpcall` themselves, since they were implemented in C. That meant `coroutine.yield()` called from *inside* a `pcall`'d function would error with "attempt to yield across C-call boundary" on 5.1 and LuaJIT (which follows 5.1's core VM model here). Lua 5.2+ lifted this restriction: `pcall`/`xpcall`/metamethods can all yield across.

## Bad

```lua
-- On Lua 5.1 / LuaJIT, this errors: cannot yield from inside pcall
local co = coroutine.create(function()
  local ok, err = pcall(function()
    coroutine.yield("waiting")  -- error on 5.1/LuaJIT: yield across C-call boundary
  end)
end)
coroutine.resume(co)
```

## Good

```lua
-- Portable pattern: don't yield from inside a pcall'd closure at all;
-- yield at the top level of the coroutine body, and use pcall only around
-- non-yielding sections
local co = coroutine.create(function()
  local status = coroutine.yield("waiting")  -- yield OUTSIDE any pcall
  local ok, err = pcall(function()
    process(status)  -- pcall here doesn't need to yield internally
  end)
  if not ok then
    coroutine.yield("error: " .. tostring(err))
  end
end)

-- On Lua 5.2+ specifically, yielding across pcall IS supported, so this
-- is fine there -- but avoid relying on it if LuaJIT/5.1 compatibility matters:
-- (5.2+ only)
local co2 = coroutine.create(function()
  local ok, result = pcall(function()
    return coroutine.yield("waiting")  -- fine on 5.2+, NOT on 5.1/LuaJIT
  end)
end)
```

## Version Note

Always verify which Lua version/dialect a target embeds (see `embed-preserve-target-version`) before relying on yield-across-pcall — LuaJIT in particular is widely deployed and still follows the 5.1-era restriction for its interpreter, even though later LuaJIT releases relaxed some of this for JIT-compiled paths; test on the actual target runtime.

## See Also

- [embed-preserve-target-version](embed-preserve-target-version.md)
- [embed-luajit-vs-plain](embed-luajit-vs-plain.md)
- [err-pcall-protect](err-pcall-protect.md)
