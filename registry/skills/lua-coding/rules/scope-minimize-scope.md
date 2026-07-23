# scope-minimize-scope

> Declare locals in the smallest enclosing scope that needs them

## Why It Matters

Locals declared too early (e.g. at the top of a long function) stay live longer than necessary, making the code harder to read (you must scroll to find where a variable is actually used) and can keep values reachable by the garbage collector longer than needed. Declaring locals as close as possible to their first use keeps functions easier to reason about.

## Bad

```lua
local function handle_request(req)
  local body, headers, status, retry_count, cache_key
  -- 30 lines later, these are finally assigned and used --
  -- readers must hold all five names in their head the whole time

  if req.method == "GET" then
    cache_key = req.path
    body = cache_lookup(cache_key)
  end
  -- ... lots of unrelated code ...
  if not body then
    retry_count = 0
    status, body = fetch(req)
  end
  return status, body, headers
end
```

## Good

```lua
local function handle_request(req)
  if req.method == "GET" then
    local cache_key = req.path
    local cached = cache_lookup(cache_key)
    if cached then return 200, cached end
  end

  local retry_count = 0
  local status, body = fetch(req)
  return status, body
end
```

## Using `do...end` to Scope Temporaries

```lua
local function setup()
  do
    local tmp_connection = connect_for_migration()
    run_migration(tmp_connection)
    tmp_connection:close()
  end
  -- tmp_connection is out of scope here; can't be misused later
  return start_server()
end
```

## See Also

- [scope-block-scoping](scope-block-scoping.md)
- [scope-local-by-default](scope-local-by-default.md)
- [scope-shadowing](scope-shadowing.md)
