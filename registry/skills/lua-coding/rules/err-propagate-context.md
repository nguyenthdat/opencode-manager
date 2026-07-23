# err-propagate-context

> Wrap and add context when propagating errors up the call stack

## Why It Matters

An error surfacing from deep in a call chain ("connection refused") is far less useful without the context of *what* was being attempted ("failed to sync user profile for user 42: connection refused"). Each layer that catches and re-raises an error should add a breadcrumb, not just pass the raw message through unchanged.

## Bad

```lua
local function sync_profile(user_id)
  local ok, err = pcall(http.post, "/profiles/" .. user_id, data)
  if not ok then
    error(err)  -- just re-throws "connection refused", loses what was happening
  end
end
```

## Good

```lua
local function sync_profile(user_id)
  local ok, err = pcall(http.post, "/profiles/" .. user_id, data)
  if not ok then
    error(("failed to sync profile for user %d: %s"):format(user_id, tostring(err)), 0)
  end
end

-- With structured errors, wrap while preserving the original as `cause`
local function sync_profile_structured(user_id)
  local ok, err = pcall(http.post, "/profiles/" .. user_id, data)
  if not ok then
    error({
      kind = "sync_failed",
      user_id = user_id,
      cause = err,   -- original error preserved for deeper inspection/logging
    })
  end
end
```

## Printing a Full Chain

```lua
local function format_chain(err)
  local parts = {}
  while err do
    table.insert(parts, type(err) == "table" and err.kind or tostring(err))
    err = type(err) == "table" and err.cause or nil
  end
  return table.concat(parts, " <- ")
end
```

## See Also

- [err-error-table](err-error-table.md)
- [err-custom-error-objects](err-custom-error-objects.md)
- [err-xpcall-traceback](err-xpcall-traceback.md)
