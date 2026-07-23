# anti-ignore-pcall-result

> Anti-pattern: ignoring `pcall`'s success/failure return value

## Why It Matters

`pcall` never crashes the caller — but that means an ignored first return value silently discards information about whether the protected call actually succeeded, and the second return value (the real result *or* the error message) becomes ambiguous without checking which case you're in.

## Bad

```lua
-- Ignoring the boolean success flag entirely
local _, data = pcall(json.decode, raw_body)
process(data)  -- if json.decode errored, `data` IS the error message string,
                -- not the decoded data -- process() gets garbage silently
```

## Good

```lua
local ok, data_or_err = pcall(json.decode, raw_body)
if not ok then
  log.error("failed to decode JSON: " .. tostring(data_or_err))
  return nil, data_or_err
end
process(data_or_err)

-- The same discipline applies to xpcall and to any function following the
-- (ok, result) or (result, err) convention
local ok2, err2 = os.rename("a.txt", "b.txt")
if not ok2 then
  error("rename failed: " .. tostring(err2))
end
```

## Catching It With Tooling

There's no perfect automated check for this (the return values are ordinary values, indistinguishable to a linter from any other function's), which makes code-review discipline and consistent adherence to `err-nil-err-pattern` the primary defense — always destructure and check both return values from a protected call.

## See Also

- [err-pcall-protect](err-pcall-protect.md)
- [err-no-silent-failure](err-no-silent-failure.md)
- [err-nil-err-pattern](err-nil-err-pattern.md)
