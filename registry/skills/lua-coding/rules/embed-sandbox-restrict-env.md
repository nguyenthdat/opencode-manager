# embed-sandbox-restrict-env

> Sandbox untrusted scripts by restricting the environment/`_ENV`

## Why It Matters

Embedding Lua to run untrusted or semi-trusted user scripts (a game's mod system, a plugin marketplace, a rules engine evaluating customer-supplied expressions) without restricting what globals/standard-library functions are reachable gives that script full access to `os.execute`, `io.open`, `require`, and anything else in `_G` — effectively arbitrary code execution on the host. Lua 5.2+'s `_ENV` mechanism (or careful sandboxing on 5.1) lets you construct a restricted global environment for untrusted code.

## Bad

```lua
-- Running user-supplied script code with the FULL standard environment --
-- the "mod script" can do anything the host process can do
local user_script = [[
  os.execute("rm -rf /")   -- runs with the host's full permissions!
]]
local fn = load(user_script)
fn()
```

## Good

```lua
-- Lua 5.2+: build a restricted environment table and set it as _ENV
-- via load()'s fourth argument
local sandbox_env = {
  print = print,
  pairs = pairs,
  ipairs = ipairs,
  tostring = tostring,
  tonumber = tonumber,
  math = { floor = math.floor, max = math.max, min = math.min },
  string = { format = string.format, sub = string.sub },
  -- deliberately omit: os, io, require, load, dofile, debug, package
}

local user_script = [[
  print("hello from a sandboxed script")
  -- os.execute("...")  -- would error: attempt to index a nil value (global 'os')
]]

local fn, err = load(user_script, "user_script", "t", sandbox_env)
if not fn then
  error("script failed to compile: " .. err)
end

local ok, run_err = pcall(fn)
if not ok then
  error("script failed: " .. tostring(run_err))
end
```

## Additional Hardening

Even with a restricted `_ENV`, consider CPU/instruction-count limits (via a debug hook counting instructions and erroring past a threshold) and memory limits to guard against infinite loops or excessive allocation from untrusted scripts — restricting globals alone doesn't prevent a `while true do end`.

## See Also

- [scope-strict-mode](scope-strict-mode.md)
- [embed-redis-scripting](embed-redis-scripting.md)
- [anti-loadstring-eval](anti-loadstring-eval.md)
