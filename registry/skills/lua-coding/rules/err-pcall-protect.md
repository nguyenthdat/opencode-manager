# err-pcall-protect

> Use `pcall` for protected calls around fallible operations

## Why It Matters

Lua's `error()` unwinds the stack like an exception, which crashes the whole script unless something catches it. `pcall` (protected call) runs a function and captures success/failure as return values instead of propagating a crash — the fundamental building block for structured error handling in Lua.

## Bad

```lua
-- One bad JSON payload crashes the entire request handler process
local function handle_request(body)
  local data = json.decode(body)  -- throws on malformed JSON
  return process(data)
end
```

## Good

```lua
local function handle_request(body)
  local ok, data_or_err = pcall(json.decode, body)
  if not ok then
    return nil, "invalid JSON: " .. tostring(data_or_err)
  end
  return process(data_or_err)
end

-- pcall also protects against runtime errors, not just explicit error() calls
local ok, result = pcall(function()
  return risky_table.field.nested  -- errors if risky_table.field is nil
end)
if not ok then
  log.warn("lookup failed: " .. tostring(result))
end
```

## Passing Arguments Directly

`pcall(f, a, b, c)` calls `f(a, b, c)` under protection — prefer this over wrapping in an anonymous function when you don't need to capture extra context, since it avoids an extra closure allocation:

```lua
local ok, result = pcall(tonumber, user_input)
```

## See Also

- [err-xpcall-traceback](err-xpcall-traceback.md)
- [err-nil-err-pattern](err-nil-err-pattern.md)
- [anti-ignore-pcall-result](anti-ignore-pcall-result.md)
