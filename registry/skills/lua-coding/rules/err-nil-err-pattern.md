# err-nil-err-pattern

> Follow the `(result, err)` / `(nil, err)` convention for fallible functions

## Why It Matters

Lua's own standard library establishes the convention: a fallible operation returns its result on success, or `nil` (or `false`) plus a second string/error-object argument on failure. Following this convention consistently means callers can use one familiar pattern (`if not ok then ...`) across your whole codebase and the standard library alike, instead of guessing whether a given function throws, returns a sentinel, or returns `false`.

## Bad

```lua
-- Inconsistent: sometimes throws, sometimes returns false, sometimes nil
local function parse_config(path)
  if not file_exists(path) then
    return false          -- caller can't tell WHY it failed
  end
  local ok, data = pcall(dofile, path)
  if not ok then
    error("bad config: " .. data)  -- but THIS failure throws instead
  end
  return data
end
```

## Good

```lua
-- Consistent (result, err) convention throughout
local function parse_config(path)
  if not file_exists(path) then
    return nil, "config file not found: " .. path
  end
  local ok, data_or_err = pcall(dofile, path)
  if not ok then
    return nil, "bad config: " .. tostring(data_or_err)
  end
  return data_or_err, nil
end

-- Callers use one uniform pattern everywhere
local config, err = parse_config("app.lua")
if not config then
  log.error(err)
  os.exit(1)
end
```

## Multiple Success Values

The pattern extends naturally: return however many success values you need, with the error always as the *last* value (or as the sole non-nil first value on failure):

```lua
local function fetch(url)
  -- success: status, body, nil
  -- failure: nil, nil, err
  local status, body = http.get(url)
  if not status then
    return nil, nil, "request failed"
  end
  return status, body, nil
end
```

## See Also

- [err-no-silent-failure](err-no-silent-failure.md)
- [err-error-vs-return-nil](err-error-vs-return-nil.md)
- [fn-multiple-returns](fn-multiple-returns.md)
