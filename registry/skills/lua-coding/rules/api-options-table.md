# api-options-table

> Use a single options table for functions with many optional named arguments

## Why It Matters

Beyond 2-3 parameters, positional arguments become error-prone (easy to swap two arguments of the same type) and impossible to extend without breaking every call site. A single trailing options table lets callers pass only what they need, by name, and lets you add new options later without changing existing call sites at all.

## Bad

```lua
-- Which boolean is which? Which number is the timeout vs retries?
local function request(url, method, timeout, retries, follow_redirects, verify_ssl)
  ...
end

request("https://api.example.com", "GET", 30, 3, true, false)  -- unreadable
```

## Good

```lua
local function request(url, opts)
  opts = opts or {}
  local method = opts.method or "GET"
  local timeout = opts.timeout or 30
  local retries = opts.retries or 3
  local follow_redirects = opts.follow_redirects
  if follow_redirects == nil then follow_redirects = true end
  local verify_ssl = opts.verify_ssl
  if verify_ssl == nil then verify_ssl = true end
  ...
end

request("https://api.example.com", {
  method = "POST",
  timeout = 10,
  verify_ssl = false,
})
```

## Keep the Required Subject Positional

Don't over-apply this — a function's one clear "subject" argument (the URL, the file path, the value being validated) usually stays positional, with only the *optional* extras moved into the trailing table:

```lua
-- Good balance: url is positional (always required, unambiguous),
-- everything optional goes in the options table
local function fetch(url, opts) ... end
```

## See Also

- [fn-default-args](fn-default-args.md)
- [api-consistent-arg-order](api-consistent-arg-order.md)
- [meta-new-constructor](meta-new-constructor.md)
