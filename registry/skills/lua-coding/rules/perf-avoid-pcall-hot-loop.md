# perf-avoid-pcall-hot-loop

> Avoid wrapping every hot-loop iteration in its own `pcall`

## Why It Matters

`pcall` sets up protected-call machinery on every invocation; calling it once per iteration of a hot loop that runs thousands of times per frame adds needless per-call overhead compared to protecting the loop as a whole (or restructuring to avoid needing protection inside the loop at all).

## Bad

```lua
-- pcall overhead paid on every single item, even though a failure in one
-- item processing doesn't need per-item granularity of protection
local function process_all(items)
  local results = {}
  for i, item in ipairs(items) do
    local ok, result = pcall(process_item, item)  -- pcall set up N times
    results[i] = ok and result or nil
  end
  return results
end
```

## Good

```lua
-- Protect the whole batch once; validate/sanitize items up front so
-- individual item processing doesn't need to be wrapped defensively
local function process_all(items)
  local ok, results = pcall(function()
    local out = {}
    for i, item in ipairs(items) do
      out[i] = process_item(item)   -- no per-iteration pcall
    end
    return out
  end)
  if not ok then
    log.error("batch processing failed: " .. tostring(results))
    return {}
  end
  return results
end

-- If individual-item failure really must be isolated (one bad item
-- shouldn't abort the whole batch), pre-validate to avoid needing pcall
-- for the common case, and reserve pcall only for genuinely risky items:
local function process_all_isolated(items)
  local results = {}
  for i, item in ipairs(items) do
    if is_known_safe(item) then
      results[i] = process_item(item)         -- no pcall needed, pre-validated
    else
      local ok, result = pcall(process_item, item)  -- pcall only for risky ones
      results[i] = ok and result or nil
    end
  end
  return results
end
```

## See Also

- [err-pcall-protect](err-pcall-protect.md)
- [perf-avoid-table-in-loop](perf-avoid-table-in-loop.md)
- [perf-profile-first](perf-profile-first.md)
